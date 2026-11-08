import { type Locator, type Page } from "@playwright/test";

export class ItemPage {
    readonly addItemButton: Locator;
    readonly invalidNumberMessage: Locator;
    readonly removeItemButton: Locator;
    readonly itemDescription: Locator;
    readonly itemTotal: Locator;

    constructor(readonly page: Page) {
        this.addItemButton = page.getByRole("button", { name: "Add a new item" });
        this.invalidNumberMessage = page.getByText("Must be a number greater than 0").first();
        this.removeItemButton = page.getByRole("button", { name: "Remove item" }).nth(1);
        this.itemDescription = page.getByRole("textbox", { name: "Description" });
        this.itemTotal = page.getByPlaceholder("Item total");
    }

    itemField(index: number, field: "name" | "quantity" | "unitPrice"): Locator {
        return this.page.locator(`input[name="details.items[${index}].${field}"]`);
    }

    async open(): Promise<void> {
        await this.page.goto("/en?step=items");
    }

    async addItem(): Promise<void> {
        await this.addItemButton.click();
    }
}
