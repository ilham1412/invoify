import { type Locator, type Page } from "@playwright/test";

export class PenyimpananPage {
    readonly savedIndicator: Locator;
    readonly newInvoiceButton: Locator;
    readonly moreActionsButton: Locator;
    readonly resetFormButton: Locator;
    readonly resetConfirmButton: Locator;
    readonly resetConfirmation: Locator;
    readonly confirmNewInvoiceButton: Locator;
    readonly newInvoiceConfirmation: Locator;
    readonly cancelNewInvoiceButton: Locator;
    readonly senderDraftField: Locator;

    constructor(readonly page: Page) {
        this.savedIndicator = page.locator("form").getByText(/^Saved/);
        this.newInvoiceButton = page.getByRole("button", { name: /^new invoice$/i });
        this.moreActionsButton = page.getByRole("button", { name: /more actions/i });
        this.resetFormButton = page.getByRole("button", { name: /reset form/i });
        this.resetConfirmButton = page.getByRole("button", { name: "Reset", exact: true });
        this.resetConfirmation = page.getByRole("alertdialog");
        this.confirmNewInvoiceButton = page.getByRole("button", { name: /^(continue|ok|new invoice)$/i }).last();
        this.newInvoiceConfirmation = page.getByRole("alertdialog");
        this.cancelNewInvoiceButton = this.newInvoiceConfirmation.getByRole("button", { name: "Cancel" });
        this.senderDraftField = page.getByRole("textbox", { name: "Name" }).first();
    }

    async open(): Promise<void> {
        await this.page.goto("/en");
    }
}
