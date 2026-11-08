import { type Locator, type Page } from "@playwright/test";

export class PratinjauPage {
    readonly livePreview: Locator;
    readonly finalPdf: Locator;
    readonly backToLivePreview: Locator;
    readonly previewFieldTargets: Locator;

    constructor(readonly page: Page) {
        this.livePreview = page.locator(".invoice-live-preview");
        this.finalPdf = page.getByRole("heading", { name: /final pdf/i });
        this.backToLivePreview = page.getByRole("button", { name: /back to live preview/i });
        this.previewFieldTargets = page.locator(".invoice-live-preview [data-edit-field]");
    }

    field(name: string): Locator {
        return this.livePreview.locator(`[data-edit-field="${name}"]`);
    }
}
