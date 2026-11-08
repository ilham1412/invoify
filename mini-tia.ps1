[CmdletBinding()]
param(
    [string[]] $ChangedFiles,
    [string] $BaseRef,
    [switch] $ListOnly,
    [switch] $NoGraphRefresh
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $repoRoot

try {
    $graphPath = Join-Path $repoRoot "dep-graph.json"
    $mappingPath = Join-Path $repoRoot "tia-mapping.json"

    if (-not $ChangedFiles -or $ChangedFiles.Count -eq 0) {
        if ($BaseRef) {
            $ChangedFiles = @(git diff --name-only --diff-filter=ACMR "$BaseRef...HEAD")
            if ($LASTEXITCODE -ne 0) {
                throw "Could not get changed files from Git base ref '$BaseRef'."
            }
        }
        else {
            $ChangedFiles = @(git diff --name-only --diff-filter=ACMR HEAD)
            if ($LASTEXITCODE -ne 0) {
                throw "Could not get changed files from Git."
            }

            $ChangedFiles += @(git diff --cached --name-only --diff-filter=ACMR)
            if ($LASTEXITCODE -ne 0) {
                throw "Could not get staged changed files from Git."
            }

            # New, untracked source/spec files are absent from git diff.
            $untrackedFiles = @(git ls-files --others --exclude-standard)
            if ($LASTEXITCODE -ne 0) {
                throw "Could not get untracked files from Git."
            }
            $ChangedFiles += $untrackedFiles
        }
    }

    $ChangedFiles = @(
        $ChangedFiles |
            ForEach-Object { $_.Trim().Replace('\', '/') } |
            Where-Object { $_ } |
            Select-Object -Unique
    )

    if ($ChangedFiles.Count -eq 0) {
        Write-Host "No changed files found; running the full Playwright suite for safety." -ForegroundColor Yellow
        if (-not $ListOnly) {
            & npx playwright test
            exit $LASTEXITCODE
        }
        exit 0
    }

    if (-not $NoGraphRefresh) {
        Write-Host "Generating fresh dependency graph..." -ForegroundColor Cyan
        & npx depcruise --config .dependency-cruiser.js --output-type json --output-to dep-graph.json app components contexts hooks i18n lib services
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Dependency Cruiser failed; falling back to the complete Playwright suite."
            if (-not $ListOnly) {
                & npx playwright test
                exit $LASTEXITCODE
            }
            exit 0
        }
    }

    if (-not (Test-Path $graphPath) -or -not (Test-Path $mappingPath)) {
        throw "Missing dep-graph.json or tia-mapping.json."
    }

    $graph = Get-Content $graphPath -Raw | ConvertFrom-Json
    $mappingData = Get-Content $mappingPath -Raw | ConvertFrom-Json
    $moduleBySource = @{}
    foreach ($module in $graph.modules) {
        $moduleBySource[$module.source.Replace('\', '/')] = $module
    }

    # Build reverse edges: dependency source -> modules which import it.
    $dependentsBySource = @{}
    foreach ($module in $graph.modules) {
        foreach ($dependency in @($module.dependencies)) {
            if (-not $dependency.resolved) { continue }
            $dependencyPath = $dependency.resolved.Replace('\', '/')
            if (-not $dependentsBySource.ContainsKey($dependencyPath)) {
                $dependentsBySource[$dependencyPath] = [System.Collections.Generic.List[string]]::new()
            }
            $dependentsBySource[$dependencyPath].Add($module.source.Replace('\', '/'))
        }
    }

    $affectedModules = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $queue = [System.Collections.Generic.Queue[string]]::new()
    $unresolvedSourceFiles = [System.Collections.Generic.List[string]]::new()

    foreach ($changedFile in $ChangedFiles) {
        $path = $changedFile.Replace('\', '/')
        if ($path -match '\.(spec|test)\.[jt]sx?$') {
            continue
        }

        if ($moduleBySource.ContainsKey($path)) {
            if ($affectedModules.Add($path)) { $queue.Enqueue($path) }
        }
        elseif ($path -match '\.(ts|tsx|js|jsx|mjs|cjs)$') {
            $unresolvedSourceFiles.Add($path)
        }
    }

    # Reverse-traverse the graph so indirect consumers are included too.
    while ($queue.Count -gt 0) {
        $current = $queue.Dequeue()
        if (-not $dependentsBySource.ContainsKey($current)) { continue }
        foreach ($dependent in $dependentsBySource[$current]) {
            if ($affectedModules.Add($dependent)) { $queue.Enqueue($dependent) }
        }
    }

    Write-Host "=== CHANGED FILES ===" -ForegroundColor Cyan
    $ChangedFiles | ForEach-Object { Write-Host " - $_" }

    Write-Host "`n=== AFFECTED MODULES (TRANSITIVE REVERSE DEPENDENCIES) ===" -ForegroundColor Cyan
    foreach ($module in $affectedModules) { Write-Host " - $module" }

    $selectedTests = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $mappingErrors = [System.Collections.Generic.List[string]]::new()

    # Directly changed specs should always be included.
    foreach ($changedFile in $ChangedFiles) {
        if ($changedFile -match '^e2e/tests/.+\.spec\.[jt]sx?$') {
            if (Test-Path (Join-Path $repoRoot $changedFile)) {
                [void] $selectedTests.Add($changedFile.Replace('\', '/'))
            }
        }
    }

    foreach ($changedFile in $ChangedFiles) {
        $changedPath = $changedFile.Replace('\', '/')
        $specificMapping = $mappingData.mappings |
            Where-Object { $_.sourcePathPattern -and $changedPath -match $_.sourcePathPattern } |
            Select-Object -First 1

        # A direct, domain-specific mapping is more useful than the very broad
        # reverse closure produced through UI barrel exports and dynamic imports.
        if ($specificMapping) {
            $candidateTests = $specificMapping.relatedTests
        }
        else {
            $candidateTests = foreach ($modulePath in $affectedModules) {
                foreach ($mapping in $mappingData.mappings) {
                    if ($modulePath -match $mapping.sourcePathPattern) {
                        $mapping.relatedTests
                    }
                }
            }
        }

        foreach ($testPath in $candidateTests) {
            $normalizedTestPath = $testPath.Replace('\', '/')
            if (Test-Path (Join-Path $repoRoot $normalizedTestPath)) {
                [void] $selectedTests.Add($normalizedTestPath)
            }
            else {
                $mappingErrors.Add("Mapped spec does not exist: $normalizedTestPath")
            }
        }
    }

    foreach ($sourcePath in $unresolvedSourceFiles) {
        Write-Warning "Changed source is missing from the dependency graph: $sourcePath"
    }
    foreach ($mappingError in ($mappingErrors | Select-Object -Unique)) {
        Write-Warning $mappingError
    }

    if ($unresolvedSourceFiles.Count -gt 0 -or $mappingErrors.Count -gt 0) {
        Write-Warning "TIA inputs/mappings are incomplete; falling back to the complete Playwright suite."
        if (-not $ListOnly) {
            & npx playwright test
            exit $LASTEXITCODE
        }
        exit 0
    }

    $testsToRun = @($selectedTests | Sort-Object)
    if ($testsToRun.Count -eq 0) {
        $hasSourceChanges = @(
            $ChangedFiles | Where-Object {
                $_ -match '\.(ts|tsx|js|jsx|mjs|cjs)$' -and
                $_ -notmatch '\.(spec|test)\.[jt]sx?$' -and
                $_ -notmatch '(^|/)(playwright\.config\.(ts|js)|\.dependency-cruiser\.js|mini-tia\.ps1|tia-mapping\.json|.*\.d\.ts)$'
            }
        ).Count -gt 0

        if ($hasSourceChanges) {
            Write-Warning "No related tests were mapped for changed source; falling back to the complete Playwright suite."
            if (-not $ListOnly) {
                & npx playwright test
                exit $LASTEXITCODE
            }
            exit 0
        }

        Write-Host "No test files selected (changed files do not require E2E tests)." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "`n=== SELECTED PLAYWRIGHT SPECS ===" -ForegroundColor Green
    $testsToRun | ForEach-Object { Write-Host " [EXECUTE] $_" }

    if ($ListOnly) {
        Write-Host "`nList-only mode: tests were not executed." -ForegroundColor Yellow
        exit 0
    }

    & npx playwright test @testsToRun
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
