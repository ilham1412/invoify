import { type Locator, type Page } from "@playwright/test";

export class PengirimPenerimaPage {
    readonly senderName: Locator;
    readonly senderEmail: Locator;
    readonly receiverName: Locator;
    readonly receiverEmail: Locator;
    readonly addCustomInputButton: Locator;
    readonly saveSenderButton: Locator;
    readonly saveClientButton: Locator;
    readonly sendersButton: Locator;
    readonly clientsButton: Locator;
    readonly invalidEmailMessage: Locator;
    readonly receiverInvalidEmailMessage: Locator;
    readonly customInputRows: Locator;
    readonly addSenderCustomInputButton: Locator;
    readonly addReceiverCustomInputButton: Locator;
    readonly customInputKeyFields: Locator;
    readonly customInputValueFields: Locator;
    readonly removeCustomInputButton: Locator;

    constructor(readonly page: Page) {
        this.senderName = page.locator('input[name="sender.name"]');
        this.senderEmail = page.locator('input[name="sender.email"]');
        this.receiverName = page.locator('input[name="receiver.name"]');
        this.receiverEmail = page.locator('input[name="receiver.email"]');
        this.addCustomInputButton = page.getByRole("button", { name: "Add Custom Input" });
        this.saveSenderButton = page.getByRole("button", { name: /save sender/i });
        this.saveClientButton = page.getByRole("button", { name: /save client/i });
        this.sendersButton = page.getByRole("button", { name: /^senders/i });
        this.clientsButton = page.getByRole("button", { name: /^clients/i });
        this.invalidEmailMessage = page.getByText("Email must be a valid email", { exact: true });
        this.receiverInvalidEmailMessage = page.getByText("Email must be a valid email", { exact: true }).last();
        this.customInputRows = page.getByRole("textbox", { name: /custom input/i });
        this.addSenderCustomInputButton = page.getByRole("button", { name: "Add custom input" });
        this.addReceiverCustomInputButton = page.getByRole("button", { name: "Add custom input to receiver" });
        this.customInputKeyFields = page.locator(
            'input[name^="sender.customInputs["][name$="].key"]'
        );
        this.customInputValueFields = page.locator(
            'input[name^="sender.customInputs["][name$="].value"]'
        );
        this.removeCustomInputButton = page.getByRole("button", { name: "Remove field" });
    }

    field(side: "sender" | "receiver", name: string): Locator {
        return this.page.locator(`input[name="${side}.${name}"]`);
    }

    save(side: "sender" | "client"): Locator {
        return side === "sender" ? this.saveSenderButton : this.saveClientButton;
    }

    select(side: "sender" | "client"): Locator {
        return side === "sender" ? this.sendersButton : this.clientsButton;
    }

    async open(): Promise<void> {
        await this.page.goto("/en?step=from-and-to");
    }
}
