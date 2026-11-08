import { test, expect } from "../../support/test";
import { SMALL_PNG_LOGO } from "../../data/logo";

test.describe("Halaman 2 - Detail Invoice", () => {
    test("P2-POS-01 - Nomor invoice dapat diisi", async ({ detailInvoice }) => {
        await detailInvoice.open();

        await detailInvoice.invoiceNumber.fill("INV-2026-001");

        await expect(detailInvoice.invoiceNumber).toHaveValue("INV-2026-001");
    });

    test("P2-POS-02 - Logo invoice dapat diunggah", async ({ detailInvoice }) => {
        await detailInvoice.open();

        await detailInvoice.logoInput.setInputFiles({
            name: "logo.png",
            mimeType: "image/png",
            buffer: Buffer.from(SMALL_PNG_LOGO.split(",")[1], "base64"),
        });

        await expect(detailInvoice.uploadedLogo).toBeVisible({
            timeout: 10_000,
        });
    });

    test("P2-NEG-01 - Nomor invoice kosong menampilkan validasi", async ({
        detailInvoice,
    }) => {
        await detailInvoice.open();

        await detailInvoice.invoiceNumber.fill("");
        await detailInvoice.invoiceNumber.blur();

        await expect(detailInvoice.requiredFieldError).toBeVisible({
            timeout: 10_000,
        });
    });

    test("P2-POS-03 - Tanggal terbit dapat dipilih dari kalender", async ({
        detailInvoice,
    }) => {
        await detailInvoice.open();
        await detailInvoice.issueDate.click();
        await detailInvoice.calendarDayButtons.filter({ hasText: "15" }).first().click();

        await expect(detailInvoice.issueDate).not.toContainText("Pick a date");
    });

    test("P2-EDGE-01 - Logo dapat dihapus setelah diunggah", async ({
        detailInvoice,
    }) => {
        await detailInvoice.open();
        await detailInvoice.logoInput.setInputFiles({
            name: "logo.png",
            mimeType: "image/png",
            buffer: Buffer.from(SMALL_PNG_LOGO.split(",")[1], "base64"),
        });
        await expect(detailInvoice.uploadedLogo).toBeVisible({
            timeout: 10_000,
        });

        await detailInvoice.removeLogoButton.click();

        await expect(detailInvoice.uploadedLogo).toBeHidden();
    });
});
