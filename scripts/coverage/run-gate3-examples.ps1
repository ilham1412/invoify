[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $repoRoot

try {
    $selectionDir = Join-Path $repoRoot "coverage-data\selection"
    New-Item -ItemType Directory -Force -Path $selectionDir | Out-Null

    $examples = @(
        @{ Name = "client"; Path = "app/components/invoice/actions/FinalPdf.tsx" },
        @{ Name = "layout"; Path = "app/components/layout/BaseNavbar.tsx" },
        @{ Name = "server"; Path = "app/api/invoice/generate/route.ts" }
    )

    $first = $true
    foreach ($example in $examples) {
        foreach ($strategy in @("M", "CD")) {
            $logFile = Join-Path $selectionDir ("{0}-{1}.json" -f $example.Name, $strategy)
            Write-Host "`n### $($example.Name) / $strategy / $($example.Path)" -ForegroundColor Cyan

            $arguments = @(
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-File", (Join-Path $repoRoot "mini-tia-select.ps1"),
                "-Strategy", $strategy,
                "-ListOnly",
                "-ChangedFiles", $example.Path,
                "-LogFile", $logFile
            )
            if (-not $first) {
                $arguments += "-NoGraphRefresh"
            }

            & powershell @arguments
            if ($LASTEXITCODE -ne 0) {
                throw "mini-tia-select.ps1 failed for $($example.Name)/$strategy"
            }
            $first = $false
        }
    }
}
finally {
    Pop-Location
}
