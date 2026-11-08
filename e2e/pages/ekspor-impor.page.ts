import { type Locator, type Page } from "@playwright/test";

export class EksporImporPage {
    readonly moreActions: Locator;
    readonly exportInvoice: Locator;
    readonly exportDialog: Locator;
    readonly importFile: Locator;
    readonly importJsonButton: Locator;
    readonly importErrorMessage: Locator;
    readonly invalidImportFileMessage: Locator;
    readonly importSuccessSenderName: Locator;

    constructor(readonly page: Page) {
        this.moreActions = page.getByRole("button", { name: /more actions/i });
        this.exportInvoice = page.getByRole("button", { name: /export invoice/i });
        this.exportDialog = page
            .getByRole("dialog")
            .filter({ hasText: "Export the invoice" });
        this.importFile = page.locator('input[type="file"]');
        this.importJsonButton = page.getByRole("button", { name: /import json/i });
        this.importErrorMessage = page.getByText(/Something went importing the invoice/i);
        this.invalidImportFileMessage = page.getByText(/Something went importing the invoice/i);
        this.importSuccessSenderName = page.locator('input[name="sender.name"]');
    }

    async open(): Promise<void> {
        await this.page.goto("/en");
        await this.moreActions.click();
        await this.exportInvoice.click();
    }

    async openImport(): Promise<void> {
        await this.page.goto("/en");
        await this.moreActions.click();
        await this.page.getByRole("button", { name: /load invoice/i }).click();
    }
    exportType(type: "JSON" | "CSV" | "XML"): Locator {
        return this.exportDialog.getByRole("button", { name: type, exact: true });
    }
}
