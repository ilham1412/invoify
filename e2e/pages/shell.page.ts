import { type Locator, type Page } from "@playwright/test";

export class ShellPage {
    readonly generatePdfButton: Locator;
    readonly formErrorToast: Locator;
    readonly savedInvoiceToast: Locator;
    readonly requiredFieldError: Locator;
    readonly invalidEmailError: Locator;
    readonly invalidImportError: Locator;
    readonly alertDialog: Locator;

    constructor(readonly page: Page) {
        this.generatePdfButton = page.getByRole("button", { name: "Generate PDF" });
        this.formErrorToast = page.getByText("Please check the form", { exact: true });
        this.savedInvoiceToast = page.getByText("Saved Invoice", { exact: true });
        this.requiredFieldError = page.getByText("Must be at least 1 character", { exact: true });
        this.invalidEmailError = page.getByText("Email must be a valid email", { exact: true });
        this.invalidImportError = page.getByText(/Something went importing the invoice/i);
        this.alertDialog = page.getByRole("alertdialog");
    }

    step(number: number): Locator {
        return this.page.getByRole("button", {
            name: new RegExp(`Step ${number}:`),
        });
    }

    async open(locale = "en"): Promise<void> {
        await this.page.goto(`/${locale}`);
    }

}
