import { test, expect } from "../../support/test";

test.describe("Halaman 3 - Item", () => {
    test("P3-POS-01 - Item dapat diisi", async ({ item }) => {
        await item.open();

        await item.itemField(0, "name").fill("Jasa Konsultasi");
        await item.itemField(0, "quantity").fill("2");
        await item.itemField(0, "unitPrice").fill("500000");

        await expect(item.itemField(0, "name")).toHaveValue("Jasa Konsultasi");
        await expect(item.itemField(0, "quantity")).toHaveValue("2");
        await expect(item.itemField(0, "unitPrice")).toHaveValue("500000");
    });

    test("P3-POS-02 - Item kedua dapat ditambahkan", async ({ item }) => {
        await item.open();
        await item.addItem();

        await expect(item.itemField(1, "name")).toBeVisible({ timeout: 10_000 });
    });

    test("P3-NEG-01 - Jumlah nol menampilkan validasi", async ({ item }) => {
        await item.open();

        const quantity = item.itemField(0, "quantity");
        await quantity.fill("0");
        await quantity.blur();

        await expect(item.invalidNumberMessage).toBeVisible({ timeout: 10_000 });
    });

    test("P3-BLK-01 - Item kosong menandai langkah ketiga bermasalah", async ({
        item,
        shell,
    }) => {
        await item.open();
        await shell.generatePdfButton.click();

        await expect(shell.formErrorToast).toBeVisible({ timeout: 10_000 });
        await expect(shell.step(3)).toHaveAttribute("aria-label", /has errors/);
    });

    test("P3-POS-03 - Total baris mengikuti jumlah dikali harga", async ({ item }) => {
        await item.open();
        await item.itemField(0, "name").fill("Jasa");
        await item.itemField(0, "quantity").fill("3");
        await item.itemField(0, "unitPrice").fill("200");

        await expect(item.itemTotal).toHaveValue(/600/);
    });

    test("P3-POS-04 - Item dapat dihapus setelah menambahkan baris kedua", async ({
        item,
    }) => {
        await item.open();
        await item.addItem();
        await expect(item.itemField(1, "name")).toBeVisible({ timeout: 10_000 });
        await item.removeItemButton.first().click();

        await expect(item.itemField(1, "name")).toBeHidden();
    });

    test("P3-NEG-02 - Harga satuan nol menampilkan validasi", async ({ item }) => {
        await item.open();
        const price = item.itemField(0, "unitPrice");
        await price.fill("0");
        await price.blur();

        await expect(item.invalidNumberMessage).toBeVisible({ timeout: 10_000 });
    });

    test("P3-EDGE-01 - Jumlah desimal dapat dimasukkan", async ({ item }) => {
        await item.open();
        const quantity = item.itemField(0, "quantity");
        await quantity.fill("1.5");

        await expect(quantity).toHaveValue("1.5");
    });
});
