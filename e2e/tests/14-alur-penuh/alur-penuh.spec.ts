import { test, expect } from "../../support/test";
import { VALID_PAYMENT } from "../../data/invoice";

test.describe("Alur penuh pembuatan invoice", () => {
    test.setTimeout(90_000);

    test("JOURNEY-POS-01 - Pengguna mengisi invoice dan menghasilkan PDF", async ({
        shell,
        pengirimPenerima,
        detailInvoice,
        item,
        pembayaran,
        ringkasan,
        pdf,
        wizard,
    }) => {
        await shell.open();

        await pengirimPenerima.senderName.fill("PT Alur Penuh");
        await pengirimPenerima.field("sender", "address").fill("Jl. Contoh No. 1");
        await pengirimPenerima.field("sender", "zipCode").fill("12345");
        await pengirimPenerima.field("sender", "city").fill("Jakarta");
        await pengirimPenerima.field("sender", "country").fill("Indonesia");
        await pengirimPenerima.senderEmail.fill("sender@example.com");
        await pengirimPenerima.field("sender", "phone").fill("081234567890");
        await pengirimPenerima.receiverName.fill("PT Klien Contoh");
        await pengirimPenerima.field("receiver", "address").fill("Jl. Klien No. 2");
        await pengirimPenerima.field("receiver", "zipCode").fill("54321");
        await pengirimPenerima.field("receiver", "city").fill("Bandung");
        await pengirimPenerima.field("receiver", "country").fill("Indonesia");
        await pengirimPenerima.receiverEmail.fill("client@example.com");
        await pengirimPenerima.field("receiver", "phone").fill("081345678901");

        await wizard.next();

        await detailInvoice.invoiceNumber.fill("JOURNEY-001");
        await detailInvoice.issueDate.click();
        await detailInvoice.calendarDayButtons.filter({ hasText: "15" }).first().click();
        await detailInvoice.dueDate.click();
        await detailInvoice.calendarDayButtons.filter({ hasText: "15" }).last().click();
        await detailInvoice.currency.click();
        await detailInvoice.currencyOptions.filter({ hasText: "IDR" }).click();

        await wizard.next();

        await item.itemField(0, "name").fill("Jasa Pengembangan");
        await item.itemField(0, "quantity").fill("2");
        await item.itemField(0, "unitPrice").fill("500000");
        await expect(item.itemTotal).toHaveValue(/1000000/);

        await wizard.next();

        await pembayaran.fill(
            VALID_PAYMENT.bankName,
            VALID_PAYMENT.accountName,
            VALID_PAYMENT.accountNumber
        );
        await wizard.next();

        await ringkasan.paymentTerms.fill("Net 30");
        await expect(ringkasan.paymentTerms).toHaveValue("Net 30");

        await shell.generatePdfButton.click();

        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });
    });

    test("JOURNEY-NEG-01 - Invoice kosong tidak bisa melewati validasi untuk dibuat PDF", async ({
        shell,
        pdf,
    }) => {
        await shell.open();
        await shell.generatePdfButton.click();

        await expect(shell.formErrorToast).toBeVisible({ timeout: 10_000 });
        await expect(pdf.finalPdf).toBeHidden();
    });

    test("JOURNEY-EDGE-01 - Isi invoice tetap ada setelah berpindah langkah", async ({
        shell,
        pengirimPenerima,
        detailInvoice,
        wizard,
    }) => {
        await shell.open();
        await pengirimPenerima.senderName.fill("PT Tetap Tersimpan");
        await wizard.next();

        await expect(detailInvoice.invoiceNumber).toBeVisible({ timeout: 10_000 });
        await wizard.back();
        await expect(pengirimPenerima.senderName).toHaveValue("PT Tetap Tersimpan");
    });

    test("JOURNEY-POS-02 - Invoice yang dibuat dapat diunduh", async ({
        alurPenuh,
        shell,
        pdf,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await pdf.downloadButton.click();
    });

    test("JOURNEY-EDGE-02 - Invoice yang dihasilkan dapat disimpan dan dimuat kembali", async ({
        alurPenuh,
        shell,
        pdf,
        invoiceTersimpan,
        pengirimPenerima,
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
        await invoiceTersimpan.loadSavedInvoiceButton.click();

        await pengirimPenerima.open();
        await expect(alurPenuh.pengirimPenerima.senderName).toHaveValue(
            "PT E2E Contoh",
            { timeout: 10_000 }
        );
    });
});
