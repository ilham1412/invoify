import { type Locator, type Page } from "@playwright/test";

export type WizardStep =
    | "from-and-to"
    | "details"
    | "items"
    | "payment"
    | "summary";

export class WizardPage {
    readonly nextButton: Locator;
    readonly backButton: Locator;
    readonly activeStep: Locator;

    constructor(readonly page: Page) {
        this.nextButton = page.getByRole("button", { name: "Next", exact: true });
        this.backButton = page.getByRole("button", { name: "Back", exact: true });
        this.activeStep = page.getByRole("button", { name: /Step \d+:.*—/ });
    }

    step(number: number): Locator {
        return this.page.getByRole("button", {
            name: new RegExp(`Step ${number}:`),
        });
    }

    async open(step?: WizardStep, locale = "en"): Promise<void> {
        await this.page.goto(step ? `/${locale}?step=${step}` : `/${locale}`);
    }

    async next(): Promise<void> {
        await this.nextButton.click();
    }

    async back(): Promise<void> {
        await this.backButton.click();
    }
}
