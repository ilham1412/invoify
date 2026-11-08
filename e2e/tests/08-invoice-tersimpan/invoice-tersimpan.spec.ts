import { test, expect } from "../../support/test";

test.describe("Invoice tersimpan", () => {
    test("SAVE-BLK-01 - Daftar invoice kosong menampilkan pesan", async ({
        invoiceTersimpan,
    }) => {
        await invoiceTersimpan.open();

        await expect(invoiceTersimpan.savedInvoicesDialog).toBeVisible({
            timeout: 10_000,
        });
        await expect(invoiceTersimpan.emptyListMessage).toBeVisible();
    });

    test("SAVE-POS-01 - Invoice hasil generate dapat disimpan", async ({
        alurPenuh,
        shell,
        pdf,
        invoiceTersimpan,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await invoiceTersimpan.saveButton.click();
        await expect(shell.savedInvoiceToast).toBeVisible({ timeout: 10_000 });
    });

    test("SAVE-POS-02 - Invoice tersimpan dapat dibuka kembali", async ({
        alurPenuh,
        shell,
        pdf,
        invoiceTersimpan,
        pembayaran,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });
        await invoiceTersimpan.saveButton.click();

        await invoiceTersimpan.moreActions.click();
        await invoiceTersimpan.loadInvoice.click();
        await expect(invoiceTersimpan.savedInvoicesDialog).toBeVisible({
            timeout: 10_000,
        });
        await expect(invoiceTersimpan.invoiceNumberText).toBeVisible();
        await invoiceTersimpan.loadSavedInvoiceButton.click();

        await pembayaran.open();
        await expect(pembayaran.bankName).toBeVisible();
    });

    test("SAVE-POS-04 - Data invoice yang dimuat kembali sama dengan yang disimpan", async ({
        alurPenuh,
        shell,
        pdf,
        invoiceTersimpan,
        pembayaran,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });
        await invoiceTersimpan.saveButton.click();
        await invoiceTersimpan.moreActions.click();
        await invoiceTersimpan.loadInvoice.click();
        await invoiceTersimpan.loadSavedInvoiceButton.click();

        await pembayaran.open();

        await expect(pembayaran.bankName).toHaveValue("Bank Indonesia", {
            timeout: 10_000,
        });
    });

    test("SAVE-EDGE-01 - Modal daftar invoice menampilkan jumlah tersimpan", async ({
        invoiceTersimpan,
    }) => {
        await invoiceTersimpan.open();

        await expect(invoiceTersimpan.invoiceCountMessage).toBeVisible({
            timeout: 10_000,
        });
    });

    test("SAVE-POS-03 - Invoice tersimpan dapat dihapus", async ({
        alurPenuh,
        shell,
        pdf,
        invoiceTersimpan,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });
        await invoiceTersimpan.saveButton.click();
        await invoiceTersimpan.moreActions.click();
        await invoiceTersimpan.loadInvoice.click();
        await expect(invoiceTersimpan.invoiceNumberText).toBeVisible({
            timeout: 10_000,
        });

        await invoiceTersimpan.deleteSavedInvoiceButton.click();

        await expect(invoiceTersimpan.emptyListMessage).toBeVisible({
            timeout: 10_000,
        });
    });
});
