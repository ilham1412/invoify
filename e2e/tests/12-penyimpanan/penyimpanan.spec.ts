import { test, expect } from "../../support/test";

test.describe("Penyimpanan invoice", () => {
    test("STORE-POS-01 - Perubahan form memunculkan indikator tersimpan", async ({
        penyimpanan,
        pengirimPenerima,
    }) => {
        await penyimpanan.open();
        await pengirimPenerima.senderName.fill("PT Penyimpanan Contoh");

        await expect(penyimpanan.savedIndicator).toBeVisible({ timeout: 10_000 });
    });

    test("STORE-POS-02 - Draft tetap ada setelah halaman dimuat ulang", async ({
        penyimpanan,
        pengirimPenerima,
    }) => {
        await penyimpanan.open();
        await pengirimPenerima.senderName.fill("PT Draft Tersimpan");
        await expect(penyimpanan.savedIndicator).toBeVisible({ timeout: 10_000 });

        await penyimpanan.page.reload();

        await expect(pengirimPenerima.senderName).toHaveValue("PT Draft Tersimpan", {
            timeout: 10_000,
        });
    });

    test("STORE-NEG-01 - Reset memerlukan konfirmasi sebelum data dibersihkan", async ({
        penyimpanan,
        pengirimPenerima,
    }) => {
        await penyimpanan.open();
        await pengirimPenerima.senderName.fill("PT Jangan Dihapus");
        await penyimpanan.moreActionsButton.click();
        await penyimpanan.resetFormButton.click();

        await expect(penyimpanan.resetConfirmation).toBeVisible({
            timeout: 10_000,
        });
        await expect(pengirimPenerima.senderName).toHaveValue("PT Jangan Dihapus");
    });

    test("STORE-POS-03 - Konfirmasi reset mengosongkan data form", async ({
        penyimpanan,
        pengirimPenerima,
    }) => {
        await penyimpanan.open();
        await pengirimPenerima.senderName.fill("PT Akan Direset");
        await penyimpanan.moreActionsButton.click();
        await penyimpanan.resetFormButton.click();
        await penyimpanan.resetConfirmButton.click();

        await expect(pengirimPenerima.senderName).toHaveValue("", {
            timeout: 10_000,
        });
    });

    test("STORE-EDGE-01 - New Invoice meminta konfirmasi saat draft berubah", async ({
        penyimpanan,
        pengirimPenerima,
    }) => {
        await penyimpanan.open();
        await pengirimPenerima.senderName.fill("PT Draft Aktif");
        await penyimpanan.moreActionsButton.click();
        await penyimpanan.newInvoiceButton.click();

        await expect(penyimpanan.newInvoiceConfirmation).toBeVisible({
            timeout: 10_000,
        });
    });

    test("STORE-NEG-02 - Membatalkan New Invoice mempertahankan draft", async ({
        penyimpanan,
        pengirimPenerima,
    }) => {
        await penyimpanan.open();
        await pengirimPenerima.senderName.fill("PT Draft Dipertahankan");
        await penyimpanan.moreActionsButton.click();
        await penyimpanan.newInvoiceButton.click();
        await penyimpanan.cancelNewInvoiceButton.click();

        await expect(pengirimPenerima.senderName).toHaveValue(
            "PT Draft Dipertahankan"
        );
    });

    test("STORE-EDGE-02 - Draft yang disimpan bertahan setelah pindah locale", async ({
        penyimpanan,
        pengirimPenerima,
    }) => {
        await penyimpanan.open();
        await pengirimPenerima.senderName.fill("PT Draft Lintas Bahasa");
        await expect(penyimpanan.savedIndicator).toBeVisible({ timeout: 10_000 });

        await penyimpanan.page.goto("/id");

        await expect(pengirimPenerima.senderName).toHaveValue(
            "PT Draft Lintas Bahasa",
            { timeout: 10_000 }
        );
    });
});
