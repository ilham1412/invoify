import { type Locator, type Page } from "@playwright/test";

export class RingkasanPage {
    readonly additionalNotes: Locator;
    readonly paymentTerms: Locator;
    readonly signature: Locator;
    readonly addDiscountButton: Locator;
    readonly addTaxButton: Locator;
    readonly addShippingButton: Locator;
    readonly includeTotalInWordsSwitch: Locator;
    readonly requiredFieldError: Locator;
    readonly signatureDialog: Locator;
    readonly typeSignatureTab: Locator;
    readonly typedSignatureInput: Locator;
    readonly signatureDoneButton: Locator;
    readonly presetNet30Button: Locator;
    readonly discountInput: Locator;
    readonly taxInput: Locator;
    readonly shippingInput: Locator;
    readonly subtotalText: Locator;
    readonly totalAmountText: Locator;
    readonly savedSignatureText: Locator;

    constructor(readonly page: Page) {
        this.additionalNotes = page.getByRole("textbox", { name: "Additional Notes" });
        this.paymentTerms = page.getByRole("textbox", { name: "Payment Terms" });
        this.signature = page.getByText("Click to add signature", { exact: true });
        this.addDiscountButton = page.getByRole("button", { name: "Discount", exact: true });
        this.addTaxButton = page.getByRole("button", { name: "Tax", exact: true });
        this.addShippingButton = page.getByRole("button", { name: "Shipping", exact: true });
        this.includeTotalInWordsSwitch = page.getByRole("switch", {
            name: "Include Total in Words?",
        });
        this.requiredFieldError = page.getByText("Must be at least 1 character", { exact: true });
        this.signatureDialog = page.getByRole("dialog").filter({ hasText: "Choose a method" });
        this.typeSignatureTab = page.getByRole("tab", { name: "Type" });
        this.typedSignatureInput = page.getByPlaceholder("Signature");
        this.signatureDoneButton = page.getByRole("button", { name: /done/i });
        this.presetNet30Button = page.getByRole("button", { name: "Net 30", exact: true });
        this.discountInput = page.getByRole("spinbutton", { name: "Discount" });
        this.taxInput = page.getByRole("spinbutton", { name: "Tax" });
        this.shippingInput = page.getByRole("spinbutton", { name: "Shipping" });
        this.subtotalText = page.getByText("Subtotal", { exact: true });
        this.totalAmountText = page.getByText("Total Amount", { exact: true });
        this.savedSignatureText = page.getByText("Dewi Contoh", { exact: true });
    }
    charge(name: "Discount" | "Tax" | "Shipping"): Locator {
        return this.page.getByText(name, { exact: true });
    }

    async open(): Promise<void> {
        await this.page.goto("/en?step=summary");
    }
}
