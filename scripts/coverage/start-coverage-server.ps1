[CmdletBinding()]
param(
    [int] $Port = 3300,
    [switch] $SkipBuild
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $repoRoot

try {
    # Browser source maps are opt-in and only needed by the coverage
    # experiment. This does not change the normal `npm run build`.
    $env:COVERAGE_SOURCEMAP = "1"
    $env:NEXT_TELEMETRY_DISABLED = "1"

    if (-not $SkipBuild) {
        Write-Host "Building production bundle with browser source maps..." -ForegroundColor Cyan
        & npx next build
        if ($LASTEXITCODE -ne 0) {
            throw "next build failed with exit code $LASTEXITCODE"
        }
    }

    Write-Host "Starting production server on port $Port..." -ForegroundColor Cyan
    & npx next start -p $Port
}
finally {
    Pop-Location
}
