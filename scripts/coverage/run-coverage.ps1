[CmdletBinding()]
param(
    [int] $BuildNumber = 1,
    [string] $BaseUrl = "http://127.0.0.1:3300"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $repoRoot

try {
    # Fail fast if the production server is not already running. The server is
    # deliberately not started here: one server must serve every spec so that
    # Next.js compilation state and timings are comparable.
    try {
        $response = Invoke-WebRequest -Uri "$BaseUrl/en" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ne 200) {
            throw "Unexpected status $($response.StatusCode)"
        }
    }
    catch {
        throw "Coverage server is not reachable at $BaseUrl. Start scripts/coverage/start-coverage-server.ps1 first."
    }

    $specFiles = @(
        Get-ChildItem (Join-Path $repoRoot "e2e\tests") -Recurse -Filter "*.spec.ts" -File |
            Sort-Object FullName
    )
    if ($specFiles.Count -ne 15) {
        Write-Warning "Expected 15 spec files, found $($specFiles.Count). Continuing anyway."
    }

    $buildDataRoot = Join-Path $repoRoot "coverage-data\build-$BuildNumber"
    $partsDir = Join-Path $buildDataRoot "parts"
    $playwrightDir = Join-Path $buildDataRoot "playwright"
    $monocartDir = Join-Path $buildDataRoot "monocart"
    New-Item -ItemType Directory -Force -Path $partsDir, $playwrightDir, $monocartDir | Out-Null

    $runsFile = Join-Path $buildDataRoot "runs.json"
    $runs = [System.Collections.Generic.List[object]]::new()

    foreach ($file in $specFiles) {
        $relative = $file.FullName.Substring($repoRoot.Length + 1).Replace('\', '/')
        $slug = $relative.
            Replace('e2e/tests/', '').
            Replace('.spec.ts', '').
            Replace('/', '__')

        $rawDir = Join-Path $repoRoot "coverage-raw\build-$BuildNumber\$slug"
        $partFile = Join-Path $partsDir "$slug.json"
        $reportDir = Join-Path $monocartDir $slug
        $jsonFile = Join-Path $playwrightDir "$slug.json"

        if (Test-Path $rawDir) {
            Remove-Item $rawDir -Recurse -Force
        }

        $env:COVERAGE = "1"
        $env:COVERAGE_RAW_DIR = $rawDir
        $env:PLAYWRIGHT_BASE_URL = $BaseUrl
        $env:PLAYWRIGHT_RETRIES = "0"
        $env:PLAYWRIGHT_JSON = "1"
        $env:PLAYWRIGHT_JSON_OUTPUT_NAME = $jsonFile

        Write-Host "`n=== [$BuildNumber] $relative ===" -ForegroundColor Cyan

        $playwrightWatch = [System.Diagnostics.Stopwatch]::StartNew()
        & npx playwright test $relative --project=desktop --workers=1 --retries=0
        $playwrightExit = $LASTEXITCODE
        $playwrightWatch.Stop()

        $processWatch = [System.Diagnostics.Stopwatch]::StartNew()
        & node "scripts/coverage/process-coverage.mjs" `
            --raw $rawDir `
            --out $partFile `
            --spec $relative `
            --build $BuildNumber `
            --report-dir $reportDir
        $processExit = $LASTEXITCODE
        $processWatch.Stop()

        $rawCount = 0
        if (Test-Path $rawDir) {
            $rawCount = @(Get-ChildItem $rawDir -Recurse -File -Filter "*.json").Count
        }

        $fileCount = 0
        if (Test-Path $partFile) {
            $part = Get-Content $partFile -Raw | ConvertFrom-Json
            $fileCount = [int] $part.fileCount
        }

        $run = [pscustomobject]@{
            spec = $relative
            slug = $slug
            buildNumber = $BuildNumber
            playwrightExitCode = $playwrightExit
            processorExitCode = $processExit
            playwrightSeconds = [Math]::Round($playwrightWatch.Elapsed.TotalSeconds, 2)
            processSeconds = [Math]::Round($processWatch.Elapsed.TotalSeconds, 2)
            rawFiles = $rawCount
            sourceFileCount = $fileCount
        }
        $runs.Add($run)
        $runsJson = ConvertTo-Json -InputObject @($runs) -Depth 6
        [System.IO.File]::WriteAllText($runsFile, $runsJson, (New-Object System.Text.UTF8Encoding($false)))
    }

    $mapOut = Join-Path $buildDataRoot "coverage-map-build-$BuildNumber.json"
    $summaryOut = Join-Path $buildDataRoot "summary-build-$BuildNumber.json"
    & node "scripts/coverage/merge-maps.mjs" `
        --parts $partsDir `
        --out $mapOut `
        --summary $summaryOut `
        --runs $runsFile `
        --build $BuildNumber
    if ($LASTEXITCODE -ne 0) {
        throw "merge-maps.mjs failed with exit code $LASTEXITCODE"
    }

    if ($BuildNumber -eq 1) {
        Copy-Item $mapOut (Join-Path $repoRoot "coverage-map.json") -Force
    }

    Write-Host "`nCoverage map: $mapOut" -ForegroundColor Green
    Write-Host "Summary:      $summaryOut" -ForegroundColor Green
    if ($BuildNumber -eq 1) {
        Write-Host "Final map:    $(Join-Path $repoRoot 'coverage-map.json')" -ForegroundColor Green
    }
}
finally {
    Pop-Location
}
