import { type Locator, type Page } from "@playwright/test";

export class InvoiceTersimpanPage {
    readonly moreActions: Locator;
    readonly loadInvoice: Locator;
    readonly saveButton: Locator;
    readonly savedInvoicesDialog: Locator;
    readonly emptyListMessage: Locator;
    readonly invoiceCountMessage: Locator;
    readonly invoiceNumberText: Locator;
    readonly loadSavedInvoiceButton: Locator;
    readonly deleteSavedInvoiceButton: Locator;

    constructor(readonly page: Page) {
        this.moreActions = page.getByRole("button", {
            name: /more actions/i,
        });
        this.loadInvoice = page.getByRole("button", { name: /load invoice/i });
        this.saveButton = page.getByRole("button", {
            name: "Save",
            exact: true,
        });
        this.savedInvoicesDialog = page
            .getByRole("dialog")
            .filter({ hasText: "Saved Invoices" });
        this.emptyListMessage = this.savedInvoicesDialog.getByText("No saved invoices");
        this.invoiceCountMessage = this.savedInvoicesDialog.getByText(
            /You have \d+ saved invoices/
        );
        this.invoiceNumberText = this.savedInvoicesDialog.getByText("INV-2026-001");
        this.loadSavedInvoiceButton = this.savedInvoicesDialog.getByRole(
            "button",
            { name: "Load", exact: true }
        );
        this.deleteSavedInvoiceButton = this.savedInvoicesDialog.getByRole(
            "button",
            { name: "Delete", exact: true }
        );
    }

    async open(): Promise<void> {
        await this.page.goto("/en");
        await this.moreActions.click();
        await this.loadInvoice.click();
    }
}
