import { type Locator, type Page } from "@playwright/test";

export class PdfPage {
    readonly generateButton: Locator;
    readonly downloadButton: Locator;
    readonly printButton: Locator;
    readonly previewButton: Locator;
    readonly finalPdf: Locator;
    readonly finalPdfFrame: Locator;
    readonly pdfLoading: Locator;
    readonly emailActionButton: Locator;

    constructor(readonly page: Page) {
        this.generateButton = page.getByRole("button", { name: "Generate PDF" });
        this.downloadButton = page.getByRole("button", { name: /download/i });
        this.printButton = page.getByRole("button", { name: /print/i });
        this.previewButton = page.getByRole("button", { name: "Preview", exact: true });
        this.finalPdf = page.getByRole("heading", { name: /final pdf/i });
        this.finalPdfFrame = page.getByTitle("Final PDF");
        this.pdfLoading = page.getByRole("button", { name: /generating/i });
        this.emailActionButton = page.getByRole("button", { name: /send to mail/i });
    }
}
