import { type Locator, type Page } from "@playwright/test";

export class DetailInvoicePage {
    readonly logoInput: Locator;
    readonly invoiceNumber: Locator;
    readonly issueDate: Locator;
    readonly dueDate: Locator;
    readonly currency: Locator;
    readonly dateButtons: Locator;
    readonly currencySelector: Locator;
    readonly requiredFieldError: Locator;
    readonly currencyOptions: Locator;
    readonly calendarDayButtons: Locator;
    readonly uploadedLogo: Locator;
    readonly removeLogoButton: Locator;

    constructor(readonly page: Page) {
        this.logoInput = page.locator('input[type="file"]');
        this.invoiceNumber = page.locator('input[name="details.invoiceNumber"]');
        this.issueDate = page.getByRole("button", { name: /Issue Date/ });
        this.dueDate = page.getByRole("button", { name: /Due Date/ });
        this.currency = page.getByRole("combobox").first();
        this.currencySelector = page.getByRole("combobox", { name: "Currency" });
        this.dateButtons = page.getByRole("button", { name: "Pick a date" });
        this.requiredFieldError = page.getByText("Must be at least 1 character", { exact: true });
        this.currencyOptions = page.getByRole("option");
        this.calendarDayButtons = page.getByRole("gridcell");
        this.uploadedLogo = page.getByAltText("Invoice Logo");
        this.removeLogoButton = page.getByRole("button", { name: "Remove logo" });
    }

    async open(): Promise<void> {
        await this.page.goto("/en?step=details");
    }
}
