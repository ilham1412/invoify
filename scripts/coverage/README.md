# Coverage experiment

Temporary tooling for the TIA experiment. It is opt-in: normal `npm run build`,
`npm run test:e2e`, and `mini-tia.ps1` keep their previous behaviour.

## 1. Start the production server with browser source maps

Run this in its own terminal and leave it running:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/coverage/start-coverage-server.ps1 -Port 3300
```

This runs `next build` with `COVERAGE_SOURCEMAP=1` and then `next start -p 3300`.
The source maps are only emitted for this build.

## 2. Gate 1: one spec

With the server running:

```powershell
$env:COVERAGE = "1"
$env:COVERAGE_RAW_DIR = "coverage-raw/gate1"
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3300"
$env:PLAYWRIGHT_RETRIES = "0"

Remove-Item coverage-raw/gate1 -Recurse -Force -ErrorAction SilentlyContinue
npx playwright test e2e/tests/06-pratinjau/pratinjau.spec.ts --project=desktop --workers=1 --retries=0

node scripts/coverage/process-coverage.mjs `
  --raw coverage-raw/gate1 `
  --out coverage-data/gate1/pratinjau-coverage.json `
  --spec e2e/tests/06-pratinjau/pratinjau.spec.ts `
  --build 0 `
  --debug coverage-data/gate1/debug.json
```

Gate 1 passes when the output contains real paths such as
`app/components/...tsx`, not only `_next/static/chunks/*.js` or
`webpack-internal:///`.

## 3. Gate 2: all 15 specs, twice

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/coverage/run-coverage.ps1 -BuildNumber 1 -BaseUrl "http://127.0.0.1:3300"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/coverage/run-coverage.ps1 -BuildNumber 2 -BaseUrl "http://127.0.0.1:3300"

node scripts/coverage/compare-maps.mjs `
  --a coverage-data/coverage-map-build-1.json `
  --b coverage-data/coverage-map-build-2.json `
  --out coverage-data/jaccard-build-1-vs-2.json
```

Build 1 also writes the final `coverage-map.json`. Build 2 is for stability
only; it never overwrites the final map.

## 4. Gate 3: selection

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File mini-tia-select.ps1 `
  -Strategy M -ListOnly `
  -ChangedFiles "app/components/invoice/actions/FinalPdf.tsx"

powershell -NoProfile -ExecutionPolicy Bypass -File mini-tia-select.ps1 `
  -Strategy CD -ListOnly -NoGraphRefresh `
  -ChangedFiles "app/components/invoice/actions/FinalPdf.tsx"
```

`M` uses `tia-mapping.json`; `CD` uses `coverage-map.json`. Both use the same
per-file reverse-dependency fallback and the same fallback/logging rules.
If you execute instead of `-ListOnly`, pass `-BaseUrl "http://127.0.0.1:3300"`
so the selected tests target the coverage server.

## Scope and threshold

- Coverage is client-side browser JavaScript only.
- Server code, non-JS files, and `e2e/` infrastructure are outside coverage
  scope; they are labelled rather than silently treated as a method failure.
- Threshold: a source file is covered when at least one **non-top-level**
  function was executed.
- The threshold is pre-registered for this map. If it is too broad, the
  summary reports it; do not change it after looking at scenarios.
