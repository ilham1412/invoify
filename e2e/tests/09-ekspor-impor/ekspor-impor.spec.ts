import { test, expect } from "../../support/test";

test.describe("Ekspor dan impor invoice", () => {
    test("EXPORT-POS-01 - Dialog ekspor menampilkan tiga format", async ({
        eksporImpor,
    }) => {
        await eksporImpor.open();

        await expect(eksporImpor.exportDialog).toBeVisible({ timeout: 10_000 });
        await expect(eksporImpor.exportType("JSON")).toBeVisible();
        await expect(eksporImpor.exportType("CSV")).toBeVisible();
        await expect(eksporImpor.exportType("XML")).toBeVisible();
    });

    test("EXPORT-EDGE-01 - Ekspor JSON menghasilkan file", async ({
        alurPenuh,
        eksporImpor,
    }) => {
        await alurPenuh.fillValidInvoice();
        await eksporImpor.open();
        await eksporImpor.exportType("JSON").click();
    });

    test("EXPORT-POS-02 - Ekspor CSV menghasilkan file", async ({
        alurPenuh,
        eksporImpor,
    }) => {
        await alurPenuh.fillValidInvoice();
        await eksporImpor.open();
        await eksporImpor.exportType("CSV").click();
    });

    test("EXPORT-POS-03 - Ekspor XML menghasilkan file", async ({
        alurPenuh,
        eksporImpor,
    }) => {
        await alurPenuh.fillValidInvoice();
        await eksporImpor.open();

        await eksporImpor.exportType("XML").click();

    });

    test("IMPORT-NEG-01 - File bukan JSON menampilkan pesan error", async ({
        eksporImpor,
    }) => {
        await eksporImpor.openImport();
        await eksporImpor.importJsonButton.click();
        await eksporImpor.importFile.setInputFiles({
            name: "catatan.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("bukan invoice"),
        });

        await expect(eksporImpor.invalidImportFileMessage.first()).toBeVisible({
            timeout: 10_000,
        });
    });

    test("IMPORT-POS-01 - File JSON invoice mengisi kembali form", async ({
        eksporImpor,
    }) => {
        await eksporImpor.openImport();
        await eksporImpor.importFile.setInputFiles({
            name: "invoice.json",
            mimeType: "application/json",
            buffer: Buffer.from(
                JSON.stringify({
                    sender: {
                        name: "PT Impor Berhasil",
                        address: "Jl. Impor No. 1",
                        zipCode: "12345",
                        city: "Jakarta",
                        country: "Indonesia",
                        email: "import@example.com",
                        phone: "081234567890",
                    },
                    receiver: {
                        name: "PT Penerima",
                        address: "Jl. Tujuan No. 2",
                        zipCode: "54321",
                        city: "Bandung",
                        country: "Indonesia",
                        email: "receiver@example.com",
                        phone: "081345678901",
                    },
                    details: {
                        invoiceLogo: "",
                        invoiceNumber: "IMPORT-001",
                        invoiceDate: "2026-01-15T00:00:00.000Z",
                        dueDate: "2026-02-15T00:00:00.000Z",
                        items: [
                            {
                                name: "Jasa",
                                description: "",
                                quantity: 1,
                                unitPrice: 100,
                                total: 100,
                            },
                        ],
                        currency: "USD",
                        language: "English",
                        paymentInformation: {
                            bankName: "Bank Contoh",
                            accountName: "PT Impor Berhasil",
                            accountNumber: "1234567890",
                        },
                        subTotal: 100,
                        totalAmount: 100,
                        totalAmountInWords: "One Hundred",
                        paymentTerms: "Net 30",
                        pdfTemplate: 1,
                    },
                })
            ),
        });

        await expect(eksporImpor.importSuccessSenderName).toHaveValue(
            "PT Impor Berhasil",
            { timeout: 10_000 }
        );
    });

    test("IMPORT-EDGE-01 - JSON rusak menampilkan pesan error", async ({
        eksporImpor,
    }) => {
        await eksporImpor.openImport();
        await eksporImpor.importFile.setInputFiles({
            name: "rusak.json",
            mimeType: "application/json",
            buffer: Buffer.from("{ data tidak lengkap"),
        });

        await expect(eksporImpor.invalidImportFileMessage).toBeVisible({
            timeout: 10_000,
        });
    });
});
