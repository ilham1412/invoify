import { type Locator, type Page } from "@playwright/test";

export class BerandaPage {
    readonly heading: Locator;
    readonly logo: Locator;
    readonly navbar: Locator;
    readonly faqHeading: Locator;
    readonly guideLink: Locator;
    readonly metadataDescription: Locator;
    readonly faqSection: Locator;
    readonly jsonLdScripts: Locator;
    readonly pageBody: Locator;

    constructor(readonly page: Page) {
        this.heading = page.getByRole("heading", { level: 1 });
        this.logo = page.getByRole("img", { name: "Invoify Logo" });
        this.navbar = page.getByRole("navigation");
        this.faqHeading = page.getByRole("heading", { name: "Questions" });
        this.guideLink = page.getByRole("link", { name: /guide/i });
        this.metadataDescription = page.locator('meta[name="description"]');
        this.faqSection = page.getByRole("heading", { name: "Questions" });
        /*
         * There are two JSON-LD blocks: a WebApplication schema in <head> and
         * a FAQPage schema rendered with the homepage FAQ. Playwright's text
         * matchers ignore <script> contents, so the payloads are read and
         * parsed instead of matched with a text selector.
         */
        this.jsonLdScripts = page.locator('script[type="application/ld+json"]');
        this.pageBody = page.getByRole("main");
    }

    async structuredData(): Promise<Record<string, unknown>[]> {
        const payloads = await this.jsonLdScripts.evaluateAll((scripts) =>
            scripts.map((script) => script.textContent ?? "")
        );

        return payloads.map(
            (payload) => JSON.parse(payload) as Record<string, unknown>
        );
    }

    async open(locale = "en"): Promise<void> {
        await this.page.goto(`/${locale}`);
    }

    async openGuide(locale = "en"): Promise<void> {
        await this.page.goto(`/${locale}/guide`);
    }
}
