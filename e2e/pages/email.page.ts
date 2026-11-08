import { type Locator, type Page } from "@playwright/test";

export class EmailPage {
    readonly sendButton: Locator;
    readonly emailInput: Locator;
    readonly sendPdfButton: Locator;
    readonly invalidEmailMessage: Locator;
    readonly emailDialog: Locator;
    readonly emailSentMessage: Locator;
    readonly emailCloseButton: Locator;
    readonly sendEmailSubmitButton: Locator;
    readonly invalidEmailText: Locator;

    constructor(readonly page: Page) {
        this.sendButton = page.getByRole("button", { name: /send to mail/i });
        this.emailInput = page.getByRole("textbox", { name: "Email" });
        this.sendPdfButton = page.getByRole("button", { name: "Send PDF" });
        this.invalidEmailMessage = page.getByText("Please enter a valid email address", { exact: true });
        this.emailDialog = page.getByRole("dialog").filter({ hasText: "Send to email" });
        this.emailSentMessage = page.getByText("Email sent", { exact: true });
        this.emailCloseButton = this.emailDialog.getByRole("button", { name: "Close" });
        this.sendEmailSubmitButton = this.emailDialog.getByRole("button", { name: "Send PDF" });
        this.invalidEmailText = this.emailDialog.getByText("Please enter a valid email address", { exact: true });
    }

    async open(): Promise<void> {
        await this.page.goto("/en");
    }
}
