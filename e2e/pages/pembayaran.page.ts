import { type Locator, type Page } from "@playwright/test";

export class PembayaranPage {
    readonly bankName: Locator;
    readonly accountName: Locator;
    readonly accountNumber: Locator;
    readonly requiredFieldError: Locator;
    readonly paymentStepError: Locator;

    constructor(readonly page: Page) {
        this.bankName = page.getByRole("textbox", { name: /Bank Name|Nama Bank/i });
        this.accountName = page.getByRole("textbox", { name: "Account Name" });
        this.accountNumber = page.getByRole("textbox", { name: "Account Number" });
        this.requiredFieldError = page.getByText("Must be at least 1 character", { exact: true });
        this.paymentStepError = page.getByRole("button", { name: /Step 4:.*has errors/ });
    }

    async open(): Promise<void> {
        await this.page.goto("/en?step=payment");
    }

    async fill(bank: string, account: string, number: string): Promise<void> {
        await this.bankName.fill(bank);
        await this.accountName.fill(account);
        await this.accountNumber.fill(number);
    }
}
