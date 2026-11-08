import { type Locator, type Page } from "@playwright/test";

export class BahasaPage {
    readonly languageButton: Locator;
    readonly languageDialog: Locator;
    readonly languageNames: Locator;
    readonly html: Locator;
    readonly activeLocale: Locator;

    constructor(readonly page: Page) {
        this.languageButton = page.getByRole("button", { name: "Languages" });
        this.languageDialog = page.getByRole("dialog").filter({ hasText: "BETA" });
        this.languageNames = this.languageDialog.locator("button span.truncate");
        this.html = page.locator("html");
        this.activeLocale = page.locator("html");
    }
    language(name: string | RegExp): Locator { return this.languageDialog.getByRole("button", { name }); }

    async open(): Promise<void> {
        await this.page.goto("/en");
    }

    async choose(name: string | RegExp): Promise<void> {
        await this.languageDialog.getByRole("button", { name }).click();
    }
}
