import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end configuration.
 *
 * These tests exist because round 2 shipped an infinite render loop that both
 * `tsc` and ESLint passed cleanly — the page was dead and nothing in CI knew.
 *
 * The application server is started separately by the developer or CI job;
 * Playwright connects to the configured `baseURL` without managing the server.
 *
 * Desktop only. The suite is run in a single desktop Chromium viewport
 * (1440x900). A second `mobile` project used to run the same specs at 375px,
 * but that duplicated every test for coverage the responsive layout already
 * gets from the container-query audit — and it made the TIA selection story
 * harder to reason about, since "one test" then meant two executions.
 */
const jsonReporter = process.env.PLAYWRIGHT_JSON === "1"
    ? (["json", { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME || "test-results/results.json" }] as const)
    : null;

export default defineConfig({
    testDir: "./e2e",
    // The suite is small; running it serially keeps the single dev server sane
    // and makes failures easier to read.
    workers: 1,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    // Measurement runs need a deterministic no-retry mode. The default is the
    // previous behaviour (retry once on CI, never locally).
    retries: process.env.PLAYWRIGHT_RETRIES
        ? Number(process.env.PLAYWRIGHT_RETRIES)
        : process.env.CI
          ? 1
          : 0,
    /*
     * The HTML report is always written, alongside the console reporter, so
     * `npx playwright show-report` works after any run without having to
     * re-run with an explicit `--reporter=html`. `open: "never"` keeps it from
     * stealing focus on every run; CI keeps its GitHub annotations on top.
     * The JSON reporter is opt-in because it is only needed by the coverage
     * experiment's offline duration analysis.
     */
    reporter: [
        process.env.CI ? ["github"] : ["list"],
        ["html", { open: "never" }],
        ...(jsonReporter ? [jsonReporter] : []),
    ],

    use: {
        // The default is unchanged; the coverage experiment points Playwright
        // at the production server it starts on another port.
        baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
        trace: "on-first-retry",
    },

    projects: [
        {
            name: "desktop",
            use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
        },
    ],
});
