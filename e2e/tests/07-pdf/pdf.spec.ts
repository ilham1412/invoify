import { test, expect } from "../../support/test";

test.describe("PDF invoice", () => {
    test.setTimeout(90_000);

    test("PDF-POS-01 - Invoice valid menghasilkan PDF", async ({ alurPenuh, shell, pdf }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();

        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });
    });

    test("PDF-POS-02 - PDF dapat diunduh", async ({ alurPenuh, shell, pdf }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await pdf.downloadButton.click();

    });

    test("PDF-BLK-01 - Form kosong tidak menghasilkan PDF", async ({ shell, pdf }) => {
        await shell.open();
        await shell.generatePdfButton.click();

        await expect(shell.formErrorToast).toBeVisible({ timeout: 10_000 });
        await expect(pdf.finalPdf).toBeHidden();
    });

    test("PDF-POS-03 - Hasil PDF dapat dibuka di tab baru", async ({ alurPenuh, shell, pdf }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await pdf.page.evaluate(() => {
            const originalOpen = window.open;
            window.open = (url, target, features) => {
                (window as Window & {
                    __openedPdf?: { url: string; target: string | null };
                }).__openedPdf = {
                    url: String(url),
                    target: target ?? null,
                };
                return originalOpen.call(window, url, target, features);
            };
        });

        await pdf.previewButton.click();

        await pdf.page.waitForFunction(() => {
            return Boolean(
                (window as Window & { __openedPdf?: unknown }).__openedPdf
            );
        });

        const openedPdf = await pdf.page.evaluate(() => {
            return (window as Window & {
                __openedPdf?: { url: string; target: string | null };
            }).__openedPdf;
        });

        expect(openedPdf?.url).toMatch(/^blob:/);
        expect(openedPdf?.target).toBe("_blank");
    });

    test("PDF-EDGE-01 - Tombol download tersedia setelah PDF dibuat", async ({
        alurPenuh,
        shell,
        pdf,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await expect(pdf.downloadButton).toBeEnabled();
        await expect(pdf.printButton).toBeEnabled();
    });

    test("PDF-EDGE-02 - Dokumen PDF tampil pada viewer hasil generate", async ({
        alurPenuh,
        shell,
        pdf,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();

        await expect(pdf.finalPdfFrame).toBeVisible({ timeout: 60_000 });
    });
});
