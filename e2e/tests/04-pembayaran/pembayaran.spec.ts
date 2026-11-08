import { test, expect } from "../../support/test";
import { EMPTY_PAYMENT, VALID_PAYMENT } from "../../data/invoice";

test.describe("Halaman 4 - Informasi Pembayaran", () => {
    test("P4-POS-01 - Data pembayaran dapat diisi", async ({ pembayaran }) => {
        await pembayaran.open();
        await pembayaran.fill(
            VALID_PAYMENT.bankName,
            VALID_PAYMENT.accountName,
            VALID_PAYMENT.accountNumber
        );

        await expect(pembayaran.bankName).toHaveValue(VALID_PAYMENT.bankName);
        await expect(pembayaran.accountName).toHaveValue(VALID_PAYMENT.accountName);
        await expect(pembayaran.accountNumber).toHaveValue(VALID_PAYMENT.accountNumber);
    });

    test("P4-NEG-01 - Nama bank kosong menampilkan validasi", async ({ pembayaran }) => {
        await pembayaran.open();
        await pembayaran.bankName.fill(EMPTY_PAYMENT.bankName);
        await pembayaran.bankName.blur();

        await expect(pembayaran.requiredFieldError).toBeVisible({ timeout: 10_000 });
    });

    test("P4-BLK-01 - Pembayaran kosong menandai langkah keempat bermasalah", async ({
        pembayaran,
        shell,
    }) => {
        await pembayaran.open();
        await shell.generatePdfButton.click();

        await expect(shell.formErrorToast).toBeVisible({ timeout: 10_000 });
        await expect(shell.step(4)).toHaveAttribute("aria-label", /has errors/);
    });

    test("P4-EDG-01 - Satu karakter diterima pada setiap field", async ({ pembayaran }) => {
        await pembayaran.open();
        await pembayaran.fill("B", "A", "1");

        await expect(pembayaran.bankName).toHaveAttribute("aria-invalid", "false");
        await expect(pembayaran.accountName).toHaveAttribute("aria-invalid", "false");
        await expect(pembayaran.accountNumber).toHaveAttribute("aria-invalid", "false");
    });

    test("P4-NEG-02 - Nama pemilik rekening kosong menampilkan validasi", async ({
        pembayaran,
    }) => {
        await pembayaran.open();
        await pembayaran.accountName.fill("");
        await pembayaran.accountName.blur();

        await expect(pembayaran.requiredFieldError.last()).toBeVisible({ timeout: 10_000 });
    });

    test("P4-NEG-03 - Nomor rekening kosong menampilkan validasi", async ({
        pembayaran,
    }) => {
        await pembayaran.open();
        await pembayaran.accountNumber.fill("");
        await pembayaran.accountNumber.blur();

        await expect(pembayaran.requiredFieldError.last()).toBeVisible({ timeout: 10_000 });
    });
});
