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
export default defineConfig({
    testDir: "./e2e",
    // The suite is small; running it serially keeps the single dev server sane
    // and makes failures easier to read.
    workers: 1,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    /*
     * The HTML report is always written, alongside the console reporter, so
     * `npx playwright show-report` works after any run without having to
     * re-run with an explicit `--reporter=html`. `open: "never"` keeps it from
     * stealing focus on every run; CI keeps its GitHub annotations on top.
     */
    reporter: [
        process.env.CI ? ["github"] : ["list"],
        ["html", { open: "never" }],
    ],

    use: {
        baseURL: "http://127.0.0.1:3000",
        trace: "on-first-retry",
    },

    projects: [
        {
            name: "desktop",
            use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
        },
    ],
});
