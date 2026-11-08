import { test, expect } from "../../support/test";

test.describe("Pratinjau invoice", () => {
    test("PREV-POS-01 - Pratinjau live tampil", async ({
        shell,
        pratinjau,
    }) => {
        await shell.open();

        await expect(pratinjau.livePreview).toBeVisible({ timeout: 10_000 });
    });

    test("PREV-POS-02 - Klik field pratinjau membuka langkah yang sesuai", async ({
        alurPenuh,
        shell,
        pratinjau,
        pengirimPenerima,
    }) => {
        await alurPenuh.fillValidInvoice();
        await expect(pratinjau.field("sender.name")).toBeVisible({
            timeout: 10_000,
        });

        await pratinjau.field("sender.name").click();

        await expect(shell.page).toHaveURL(/step=from-and-to/);
        await expect(pengirimPenerima.senderName).toBeFocused();
    });

    test("PREV-EDGE-01 - Mengubah form mengembalikan tampilan ke pratinjau live", async ({
        alurPenuh,
        shell,
        pratinjau,
        pengirimPenerima,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pratinjau.finalPdf).toBeVisible({ timeout: 60_000 });
        await pratinjau.backToLivePreview.click();
        await pengirimPenerima.open();

        await pengirimPenerima.senderName.fill("Nama Baru");

        await expect(pratinjau.livePreview).toBeVisible({ timeout: 10_000 });
        await expect(pratinjau.finalPdf).toBeHidden();
    });

    test("PREV-BLK-01 - Pratinjau tetap tampil saat invoice masih kosong", async ({
        shell,
        pratinjau,
    }) => {
        await shell.open();

        await expect(pratinjau.livePreview).toBeVisible({ timeout: 10_000 });
        await expect(pratinjau.finalPdf).toBeHidden();
    });

    test("PREV-EDGE-02 - Preview dapat membuka field pada langkah lain", async ({
        alurPenuh,
        shell,
        pratinjau,
        detailInvoice,
    }) => {
        await alurPenuh.fillValidInvoice();
        await expect(pratinjau.field("details.invoiceNumber")).toBeVisible({
            timeout: 10_000,
        });

        await pratinjau.field("details.invoiceNumber").click();

        await expect(shell.page).toHaveURL(/step=details/);
        await expect(detailInvoice.invoiceNumber).toBeFocused();
    });

    test("PREV-EDGE-03 - Semua bagian preview memiliki target field yang dapat dipilih", async ({
        alurPenuh,
        pratinjau,
    }) => {
        await alurPenuh.fillValidInvoice();

        await expect(pratinjau.previewFieldTargets.first()).toBeVisible({
            timeout: 10_000,
        });
        await expect(pratinjau.previewFieldTargets).not.toHaveCount(0);
    });
});
