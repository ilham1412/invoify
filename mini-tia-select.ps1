[CmdletBinding()]
param(
    [ValidateSet("M", "CD")]
    [string] $Strategy = "M",

    [string[]] $ChangedFiles,
    [string] $BaseRef,
    [switch] $ListOnly,
    [switch] $NoGraphRefresh,
    [string] $LogFile,
    [string] $BaseUrl
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $repoRoot

function Normalize-RepoPath {
    param([string] $Path)
    return ($Path.Trim().Replace('\', '/'))
}

function Get-ChangedFiles {
    if ($ChangedFiles -and $ChangedFiles.Count -gt 0) {
        return @($ChangedFiles | ForEach-Object { Normalize-RepoPath $_ } | Where-Object { $_ } | Select-Object -Unique)
    }

    if ($BaseRef) {
        $files = @(git diff --name-only --diff-filter=ACMR "$BaseRef...HEAD")
        if ($LASTEXITCODE -ne 0) {
            throw "Could not get changed files from Git base ref '$BaseRef'."
        }
        return @($files | ForEach-Object { Normalize-RepoPath $_ } | Where-Object { $_ } | Select-Object -Unique)
    }

    $files = @(git diff --name-only --diff-filter=ACMR HEAD)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not get changed files from Git."
    }
    $files += @(git diff --cached --name-only --diff-filter=ACMR)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not get staged changed files from Git."
    }
    $files += @(git ls-files --others --exclude-standard)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not get untracked files from Git."
    }

    return @($files | ForEach-Object { Normalize-RepoPath $_ } | Where-Object { $_ } | Select-Object -Unique)
}

function Test-SourceFile {
    param([string] $Path)
    return (
        $Path -match '\.(ts|tsx|js|jsx|mjs|cjs)$' -and
        $Path -notmatch '\.(spec|test)\.[jt]sx?$' -and
        $Path -notmatch '\.d\.ts$'
    )
}

function Test-OutsideCoverageScope {
    param([string] $Path)
    if (-not (Test-SourceFile $Path)) { return $true }
    if ($Path -match '^(app/api|lib/server|services/[^/]+/server)/') { return $true }
    if ($Path -match '^(middleware\.ts|next\.config\.[jt]s|types\.ts)$') { return $true }
    return $false
}

function Get-SpecsFromMap {
    param([string] $Path)

    $result = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)

    if ($Strategy -eq "CD") {
        if ($coverageReverse.ContainsKey($Path)) {
            foreach ($spec in $coverageReverse[$Path]) {
                [void] $result.Add($spec)
            }
        }
        return $result
    }

    # Strategy M: union every matching manual pattern. Do not use
    # Select-Object -First 1, because that silently drops overlapping mappings.
    foreach ($mapping in $mappingData.mappings) {
        if (-not $mapping.sourcePathPattern) { continue }
        if ($Path -match $mapping.sourcePathPattern) {
            foreach ($spec in @($mapping.relatedTests)) {
                [void] $result.Add((Normalize-RepoPath $spec))
            }
        }
    }
    return $result
}

function Get-TestCount {
    param([string[]] $Specs)
    if (-not $Specs -or $Specs.Count -eq 0) { return 0 }
    $output = & npx playwright test --list --project=desktop @Specs 2>&1
    $text = ($output | Out-String)
    $match = [regex]::Match($text, 'Total:\s+(\d+)\s+tests?')
    if ($match.Success) { return [int] $match.Groups[1].Value }
    return -1
}

$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
$fallback = $false
$fallbackReason = ""
$outsideScope = [System.Collections.Generic.List[string]]::new()
$selectionSources = @{}
$selectedSpecs = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$affectedModules = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
$changedFilesMissingFromGraph = [System.Collections.Generic.List[string]]::new()
$coverageMapFilesMissingFromGraph = [System.Collections.Generic.List[string]]::new()
$mappingErrors = [System.Collections.Generic.List[string]]::new()

try {
    $changed = @(Get-ChangedFiles)

    if ($changed.Count -eq 0) {
        $fallback = $true
        $fallbackReason = "no-changed-files"
    }

    $graphPath = Join-Path $repoRoot "dep-graph.json"
    $mappingPath = Join-Path $repoRoot "tia-mapping.json"
    $coverageMapPath = Join-Path $repoRoot "coverage-map.json"

    if (-not $NoGraphRefresh) {
        Write-Host "Generating fresh dependency graph..." -ForegroundColor Cyan
        & npx depcruise --config .dependency-cruiser.js --output-type json --output-to dep-graph.json app components contexts hooks i18n lib services
        if ($LASTEXITCODE -ne 0) {
            $fallback = $true
            $fallbackReason = "dependency-graph-failed"
        }
    }

    if (-not $fallback) {
        if (-not (Test-Path $graphPath)) {
            $fallback = $true
            $fallbackReason = "dep-graph-missing"
        }
        elseif ($Strategy -eq "M" -and -not (Test-Path $mappingPath)) {
            $fallback = $true
            $fallbackReason = "tia-mapping-missing"
        }
        elseif ($Strategy -eq "CD" -and -not (Test-Path $coverageMapPath)) {
            $fallback = $true
            $fallbackReason = "coverage-map-missing"
        }
    }

    if (-not $fallback) {
        $graph = Get-Content $graphPath -Raw | ConvertFrom-Json
        $moduleBySource = @{}
        foreach ($module in $graph.modules) {
            $moduleBySource[(Normalize-RepoPath $module.source)] = $module
        }

        # Reverse edges: dependency -> modules that import it.
        $dependentsBySource = @{}
        foreach ($module in $graph.modules) {
            $source = Normalize-RepoPath $module.source
            foreach ($dependency in @($module.dependencies)) {
                if (-not $dependency.resolved) { continue }
                $dependencyPath = Normalize-RepoPath $dependency.resolved
                if (-not $dependentsBySource.ContainsKey($dependencyPath)) {
                    $dependentsBySource[$dependencyPath] = [System.Collections.Generic.List[string]]::new()
                }
                $dependentsBySource[$dependencyPath].Add($source)
            }
        }

        $mappingData = $null
        $coverageReverse = @{}
        if ($Strategy -eq "M") {
            $mappingData = Get-Content $mappingPath -Raw | ConvertFrom-Json
        }
        else {
            $coverageMap = Get-Content $coverageMapPath -Raw | ConvertFrom-Json
            foreach ($specProperty in $coverageMap.specs.PSObject.Properties) {
                $spec = Normalize-RepoPath $specProperty.Name
                foreach ($file in @($specProperty.Value)) {
                    $normalizedFile = Normalize-RepoPath $file
                    if (-not $coverageReverse.ContainsKey($normalizedFile)) {
                        $coverageReverse[$normalizedFile] = [System.Collections.Generic.List[string]]::new()
                    }
                    $coverageReverse[$normalizedFile].Add($spec)
                }
            }

            # Report coverage-map files that the dependency graph cannot see.
            # This is a diagnostic, not a reason to fall back by itself.
            foreach ($file in $coverageReverse.Keys) {
                if (-not $moduleBySource.ContainsKey($file)) {
                    $coverageMapFilesMissingFromGraph.Add($file)
                }
            }
        }

        # Specs that changed are always selected, regardless of the map.
        foreach ($path in $changed) {
            if ($path -match '^e2e/tests/.+\.spec\.[jt]sx?$' -and (Test-Path (Join-Path $repoRoot $path))) {
                [void] $selectedSpecs.Add($path)
                if (-not $selectionSources.ContainsKey($path)) {
                    $selectionSources[$path] = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
                }
                [void] $selectionSources[$path].Add("direct-spec-change")
            }
        }

        foreach ($path in $changed) {
            if ($path -match '^e2e/tests/.+\.spec\.[jt]sx?$') { continue }

            if ($path -match '^e2e/(pages|support|data)/') {
                $fallback = $true
                $fallbackReason = "e2e-infrastructure"
                break
            }

            $directSpecs = Get-SpecsFromMap $path
            if ($directSpecs.Count -gt 0) {
                foreach ($spec in $directSpecs) {
                    if (-not (Test-Path (Join-Path $repoRoot $spec))) {
                        $mappingErrors.Add("Mapped spec does not exist: $spec")
                        continue
                    }
                    [void] $selectedSpecs.Add($spec)
                    if (-not $selectionSources.ContainsKey($spec)) {
                        $selectionSources[$spec] = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
                    }
                    [void] $selectionSources[$spec].Add("direct-map")
                }
                continue
            }

            if (-not $moduleBySource.ContainsKey($path)) {
                if (Test-OutsideCoverageScope $path) {
                    $outsideScope.Add($path)
                }
                else {
                    $changedFilesMissingFromGraph.Add($path)
                }
                continue
            }

            # Reverse dependency is computed for this changed file only, not as
            # a global union of every changed file.
            $perFileAffected = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
            $queue = [System.Collections.Generic.Queue[string]]::new()
            if ($perFileAffected.Add($path)) { $queue.Enqueue($path) }

            while ($queue.Count -gt 0) {
                $current = $queue.Dequeue()
                [void] $affectedModules.Add($current)
                if (-not $dependentsBySource.ContainsKey($current)) { continue }
                foreach ($dependent in $dependentsBySource[$current]) {
                    if ($perFileAffected.Add($dependent)) { $queue.Enqueue($dependent) }
                }
            }

            $viaDependency = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
            foreach ($modulePath in $perFileAffected) {
                foreach ($spec in (Get-SpecsFromMap $modulePath)) {
                    [void] $viaDependency.Add($spec)
                }
            }

            foreach ($spec in $viaDependency) {
                if (-not (Test-Path (Join-Path $repoRoot $spec))) {
                    $mappingErrors.Add("Mapped spec does not exist: $spec")
                    continue
                }
                [void] $selectedSpecs.Add($spec)
                if (-not $selectionSources.ContainsKey($spec)) {
                    $selectionSources[$spec] = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
                }
                [void] $selectionSources[$spec].Add("via-dependency")
            }

            if ($viaDependency.Count -eq 0) {
                if (Test-OutsideCoverageScope $path) {
                    $outsideScope.Add($path)
                }
                elseif (Test-SourceFile $path) {
                    $fallback = $true
                    $fallbackReason = "empty-selection-for-source"
                    break
                }
            }
        }

        if ($mappingErrors.Count -gt 0) {
            $fallback = $true
            $fallbackReason = "mapped-spec-missing"
        }
        if ($changedFilesMissingFromGraph.Count -gt 0) {
            $fallback = $true
            if (-not $fallbackReason) { $fallbackReason = "source-not-in-graph" }
        }
    }

    $stopwatch.Stop()

    $selected = @($selectedSpecs | Sort-Object)
    $testCount = Get-TestCount $selected

    $logPath = $LogFile
    if (-not $logPath) {
        $logPath = Join-Path $repoRoot ("coverage-data\selection\selection-{0}-{1}.json" -f $Strategy.ToLower(), (Get-Date -Format "yyyyMMdd-HHmmss"))
    }
    if ([System.IO.Path]::IsPathRooted($logPath)) {
        $logPath = [System.IO.Path]::GetFullPath($logPath)
    }
    else {
        $logPath = [System.IO.Path]::GetFullPath((Join-Path $repoRoot $logPath))
    }
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $logPath) | Out-Null

    $selectionSourceMap = @{}
    foreach ($key in $selectionSources.Keys) {
        $selectionSourceMap[$key] = @($selectionSources[$key] | Sort-Object)
    }

    $log = [pscustomobject]@{
        timestamp = (Get-Date).ToString("o")
        strategy = $Strategy
        changedFiles = $changed
        affectedModuleCount = $affectedModules.Count
        selectedSpecs = $selected
        selectedTestCount = $testCount
        selectionSources = $selectionSourceMap
        fallback = $fallback
        fallbackReason = $fallbackReason
        outsideCoverageScope = @($outsideScope | Sort-Object -Unique)
        changedFilesMissingFromGraph = @($changedFilesMissingFromGraph | Sort-Object -Unique)
        coverageMapFilesMissingFromGraph = @($coverageMapFilesMissingFromGraph | Sort-Object -Unique)
        mappingErrors = @($mappingErrors | Sort-Object -Unique)
        analysisSeconds = [Math]::Round($stopwatch.Elapsed.TotalSeconds, 3)
        graphRefreshed = (-not $NoGraphRefresh)
        mapSource = $(if ($Strategy -eq "M") { "tia-mapping.json" } else { "coverage-map.json" })
    }
    $logJson = $log | ConvertTo-Json -Depth 8
    [System.IO.File]::WriteAllText($logPath, $logJson, (New-Object System.Text.UTF8Encoding($false)))

    Write-Host "`n=== TIA SELECTION ($Strategy) ===" -ForegroundColor Cyan
    Write-Host "Changed files: $($changed.Count)"
    Write-Host "Affected modules (reverse closure): $($affectedModules.Count)"
    Write-Host "Selected specs: $($selected.Count)"
    if ($testCount -ge 0) { Write-Host "Selected tests: $testCount" }
    Write-Host "Analysis time: $($log.analysisSeconds)s"
    if ($outsideScope.Count -gt 0) {
        Write-Host "Outside coverage scope: $($outsideScope.Count)" -ForegroundColor Yellow
        $outsideScope | Select-Object -Unique | ForEach-Object { Write-Host "  [OUTSIDE] $_" -ForegroundColor Yellow }
    }
    if ($fallback) {
        Write-Host "FALLBACK: full suite ($fallbackReason)" -ForegroundColor Yellow
    }
    else {
        foreach ($spec in $selected) {
            $sources = @($selectionSources[$spec] | Sort-Object) -join ", "
            Write-Host "  [EXECUTE] $spec  ($sources)" -ForegroundColor Green
        }
    }
    if ($changedFilesMissingFromGraph.Count -gt 0) {
        Write-Host "Changed source files missing from dep-graph: $($changedFilesMissingFromGraph.Count)" -ForegroundColor Yellow
        $changedFilesMissingFromGraph | Select-Object -First 20 | ForEach-Object { Write-Host "  [NOGRAPH] $_" -ForegroundColor Yellow }
    }
    if ($coverageMapFilesMissingFromGraph.Count -gt 0) {
        Write-Host "Coverage-map files missing from dep-graph (diagnostic): $($coverageMapFilesMissingFromGraph.Count)" -ForegroundColor Yellow
        $coverageMapFilesMissingFromGraph | Select-Object -First 20 | ForEach-Object { Write-Host "  [DIAG-NOGRAPH] $_" -ForegroundColor Yellow }
    }
    Write-Host "Log: $logPath"

    if ($ListOnly) {
        Write-Host "`nList-only mode: tests were not executed." -ForegroundColor Yellow
        exit 0
    }

    if ($BaseUrl) {
        $env:PLAYWRIGHT_BASE_URL = $BaseUrl
        $env:PLAYWRIGHT_RETRIES = "0"
    }

    if ($fallback) {
        & npx playwright test
    }
    elseif ($selected.Count -eq 0) {
        Write-Host "No test files selected." -ForegroundColor Yellow
        exit 0
    }
    else {
        & npx playwright test @selected
    }
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
