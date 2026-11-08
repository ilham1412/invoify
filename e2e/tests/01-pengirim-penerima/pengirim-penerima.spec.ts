import { test, expect } from "../../support/test";

test.describe("Halaman 1 - Pengirim dan Penerima", () => {
    test("P1-POS-01 - Data pengirim dan penerima dapat diisi", async ({
        pengirimPenerima,
    }) => {
        await pengirimPenerima.open();

        await pengirimPenerima.senderName.fill("PT Sumber Jaya");
        await pengirimPenerima.field("sender", "address").fill("Jl. Merdeka No. 10");
        await pengirimPenerima.field("sender", "zipCode").fill("10110");
        await pengirimPenerima.field("sender", "city").fill("Jakarta");
        await pengirimPenerima.field("sender", "country").fill("Indonesia");
        await pengirimPenerima.senderEmail.fill("sender@example.com");
        await pengirimPenerima.field("sender", "phone").fill("081234567890");

        await pengirimPenerima.receiverName.fill("PT Maju Bersama");
        await pengirimPenerima.field("receiver", "address").fill("Jl. Sudirman No. 20");
        await pengirimPenerima.field("receiver", "zipCode").fill("10220");
        await pengirimPenerima.field("receiver", "city").fill("Jakarta");
        await pengirimPenerima.field("receiver", "country").fill("Indonesia");
        await pengirimPenerima.receiverEmail.fill("receiver@example.com");
        await pengirimPenerima.field("receiver", "phone").fill("081345678901");

        await expect(pengirimPenerima.senderName).toHaveValue("PT Sumber Jaya");
        await expect(pengirimPenerima.receiverName).toHaveValue("PT Maju Bersama");
    });

    test("P1-NEG-01 - Email pengirim yang salah ditolak", async ({
        pengirimPenerima,
    }) => {
        await pengirimPenerima.open();

        await pengirimPenerima.senderEmail.fill("email-salah");
        await pengirimPenerima.senderEmail.blur();

        await expect(pengirimPenerima.invalidEmailMessage).toBeVisible({
            timeout: 10_000,
        });
    });

    test("P1-BLK-01 - Data kosong menandai langkah pertama bermasalah", async ({
        pengirimPenerima,
        shell,
    }) => {
        await pengirimPenerima.open();
        await shell.generatePdfButton.click();

        await expect(shell.formErrorToast).toBeVisible({ timeout: 10_000 });
        await expect(shell.step(1)).toHaveAttribute("aria-label", /has errors/);
    });

    test("P1-EDG-01 - Huruf pada telepon tidak disimpan", async ({
        pengirimPenerima,
    }) => {
        await pengirimPenerima.open();

        const phone = pengirimPenerima.field("sender", "phone");
        await phone.fill("0812abc-345");

        await expect(phone).toHaveValue("0812-345");
    });

    test("P1-NEG-02 - Email penerima yang salah ditolak", async ({
        pengirimPenerima,
    }) => {
        await pengirimPenerima.open();
        await pengirimPenerima.receiverEmail.fill("alamat-tidak-valid");
        await pengirimPenerima.receiverEmail.blur();

        await expect(pengirimPenerima.receiverInvalidEmailMessage).toBeVisible({
            timeout: 10_000,
        });
    });

    test("P1-POS-02 - Custom input dapat ditambahkan pada pengirim", async ({
        pengirimPenerima,
    }) => {
        await pengirimPenerima.open();
        await pengirimPenerima.addSenderCustomInputButton.first().click();

        await expect(pengirimPenerima.customInputKeyFields.first()).toBeVisible({
            timeout: 10_000,
        });
        await expect(pengirimPenerima.customInputValueFields.first()).toBeVisible();

        await pengirimPenerima.customInputKeyFields.fill("ID Pajak");
        await pengirimPenerima.customInputValueFields.first().fill("NPWP-123");
        await expect(pengirimPenerima.customInputKeyFields).toHaveValue("ID Pajak");

        await pengirimPenerima.removeCustomInputButton.click();
        await expect(pengirimPenerima.customInputKeyFields).toHaveCount(0);
    });

    test("P1-EDGE-01 - Nama dengan panjang minimum dapat diterima", async ({
        pengirimPenerima,
    }) => {
        await pengirimPenerima.open();
        await pengirimPenerima.senderName.fill("AB");
        await pengirimPenerima.senderName.blur();

        await expect(pengirimPenerima.senderName).toHaveAttribute("aria-invalid", "false");
    });
});
