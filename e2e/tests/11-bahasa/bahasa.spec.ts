import { test, expect } from "../../support/test";

test.describe("Bahasa aplikasi", () => {
    test("LANG-POS-01 - Daftar bahasa dapat dibuka", async ({ bahasa }) => {
        await bahasa.open();
        await bahasa.languageButton.click();

        await expect(bahasa.languageDialog).toBeVisible({ timeout: 10_000 });
        await expect(bahasa.language("English")).toBeVisible();
        await expect(bahasa.language("Bahasa Indonesia")).toBeVisible();
    });

    test("LANG-POS-02 - Memilih Bahasa Indonesia mengganti locale", async ({
        bahasa,
    }) => {
        await bahasa.open();
        await bahasa.languageButton.click();
        await bahasa.language("Bahasa Indonesia").click();

        await expect(bahasa.page).toHaveURL(/\/id(?:\?|$)/, { timeout: 15_000 });
    });

    test("LANG-EDGE-01 - Bahasa Arab mengatur arah halaman menjadi RTL", async ({
        bahasa,
    }) => {
        await bahasa.page.goto("/ar");

        await expect(bahasa.html).toHaveAttribute("dir", "rtl", {
            timeout: 10_000,
        });
    });

    test("LANG-NEG-01 - Locale tidak dikenal tidak membuka halaman aplikasi", async ({
        bahasa,
    }) => {
        const response = await bahasa.page.goto("/xx");

        expect(response?.status()).toBe(404);
    });

    test("LANG-EDGE-02 - Locale pada tautan langsung tetap menampilkan form", async ({
        bahasa,
        pembayaran,
    }) => {
        await bahasa.page.goto("/id?step=payment");

        await expect(bahasa.page).toHaveURL(/\/id\?step=payment/);
        await expect(pembayaran.bankName).toBeVisible({ timeout: 10_000 });
    });

    test("LANG-EDGE-03 - Daftar bahasa memuat 18 pilihan", async ({ bahasa }) => {
        await bahasa.open();
        await bahasa.languageButton.click();

        await expect(bahasa.languageNames).toHaveCount(18);
    });

    test("LANG-POS-03 - Berpindah bahasa mempertahankan data yang sudah diketik", async ({
        bahasa,
        pengirimPenerima,
    }) => {
        await bahasa.open();
        await pengirimPenerima.senderName.fill("PT Bahasa Berubah");
        await bahasa.languageButton.click();
        await bahasa.language("Bahasa Indonesia").click();

        await expect(bahasa.page).toHaveURL(/\/id(?:\?|$)/, { timeout: 15_000 });
        await expect(pengirimPenerima.senderName).toHaveValue("PT Bahasa Berubah", {
            timeout: 10_000,
        });
    });
});
