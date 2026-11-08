import { test, expect } from "../../support/test";

test.describe("Halaman 5 - Ringkasan", () => {
    test("P5-POS-01 - Syarat pembayaran dapat diisi", async ({ ringkasan }) => {
        await ringkasan.open();
        await ringkasan.paymentTerms.fill("Net 30");

        await expect(ringkasan.paymentTerms).toHaveValue("Net 30");
    });

    test("P5-POS-02 - Catatan tambahan dapat diisi", async ({ ringkasan }) => {
        await ringkasan.open();
        await ringkasan.additionalNotes.fill("Terima kasih atas kerja samanya.");

        await expect(ringkasan.additionalNotes).toHaveValue(
            "Terima kasih atas kerja samanya."
        );
    });

    test("P5-NEG-01 - Syarat pembayaran kosong menampilkan validasi", async ({
        ringkasan,
    }) => {
        await ringkasan.open();
        await ringkasan.paymentTerms.fill("");
        await ringkasan.paymentTerms.blur();

        await expect(ringkasan.requiredFieldError).toBeVisible({ timeout: 10_000 });
    });

    test("P5-BLK-01 - Ringkasan kosong menolak pembuatan invoice", async ({
        ringkasan,
        shell,
    }) => {
        await ringkasan.open();
        await shell.generatePdfButton.click();

        await expect(shell.formErrorToast).toBeVisible({ timeout: 10_000 });
        await expect(shell.step(5)).toHaveAttribute("aria-label", /has errors/);
    });

    test("P5-POS-03 - Preset Net 30 mengisi syarat pembayaran", async ({ ringkasan }) => {
        await ringkasan.open();
        await ringkasan.presetNet30Button.click();

        await expect(ringkasan.paymentTerms).toHaveValue("Net 30");
    });

    test("P5-POS-04 - Pajak dapat ditambahkan dan diisi", async ({ ringkasan }) => {
        await ringkasan.open();
        await ringkasan.addTaxButton.click();
        await ringkasan.taxInput.fill("10");

        await expect(ringkasan.taxInput).toHaveValue("10");
    });

    test("P5-POS-05 - Tanda tangan teks dapat ditambahkan", async ({ ringkasan }) => {
        await ringkasan.open();
        await ringkasan.signature.click();
        await ringkasan.typeSignatureTab.click();
        await ringkasan.typedSignatureInput.fill("Dewi Contoh");
        await ringkasan.signatureDoneButton.click();

        await expect(ringkasan.savedSignatureText).toBeVisible({
            timeout: 10_000,
        });
    });

    test("P5-EDGE-01 - Pajak di batas maksimum dapat diisi", async ({ ringkasan }) => {
        await ringkasan.open();
        await ringkasan.addTaxButton.click();
        await ringkasan.taxInput.fill("1000000");
        await ringkasan.taxInput.blur();

        await expect(ringkasan.taxInput).toHaveValue("1000000");
        await expect(ringkasan.requiredFieldError).toBeHidden();
    });
});
