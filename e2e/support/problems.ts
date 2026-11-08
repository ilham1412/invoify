import type { Page } from "@playwright/test";

const EXPECTED_FAILED_REQUESTS = [/\/_vercel\/insights\//];

export function collectProblems(page: Page, problems: string[]): void {
    page.on("console", (message) => {
        if (message.type() === "error") {
            problems.push(`console: ${message.text()}`);
        }
    });

    page.on("pageerror", (error) => {
        problems.push(`pageerror: ${error.message}`);
    });

    page.on("response", (response) => {
        if (response.status() < 400) return;

        const url = response.url();
        if (EXPECTED_FAILED_REQUESTS.some((pattern) => pattern.test(url))) return;

        problems.push(`http ${response.status()}: ${url}`);
    });
}
