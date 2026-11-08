export const VALID_INVOICE = {
    sender: {
        name: "PT Sumber Jaya",
        address: "Jl. Merdeka No. 10",
        zipCode: "10110",
        city: "Jakarta",
        country: "Indonesia",
        email: "sender@example.com",
        phone: "+62 812 3456 7890",
    },
    receiver: {
        name: "PT Maju Bersama",
        address: "Jl. Sudirman No. 20",
        zipCode: "10220",
        city: "Jakarta",
        country: "Indonesia",
        email: "receiver@example.com",
        phone: "+62 813 4567 8901",
    },
    details: {
        invoiceLogo: "",
        invoiceNumber: "INV-2026-001",
        invoiceDate: "2026-01-15T00:00:00.000Z",
        dueDate: "2026-02-15T00:00:00.000Z",
        items: [
            {
                name: "Jasa Konsultasi",
                description: "Konsultasi pengembangan sistem",
                quantity: 2,
                unitPrice: 500000,
                total: 1000000,
            },
        ],
        currency: "IDR",
        language: "Indonesian",
        taxDetails: {
            amount: 0,
            amountType: "percentage",
            taxID: "",
        },
        discountDetails: {
            amount: 0,
            amountType: "percentage",
        },
        shippingDetails: {
            cost: 0,
            costType: "percentage",
        },
        paymentInformation: {
            bankName: "Bank Indonesia",
            accountName: "PT Sumber Jaya",
            accountNumber: "1234567890",
        },
        additionalNotes: "Terima kasih atas kerja samanya.",
        paymentTerms: "Net 30",
        subTotal: 1000000,
        totalAmount: 1000000,
        totalAmountInWords: "Satu Juta Rupiah",
        pdfTemplate: 1,
        theme: {
            accentColor: "#4F46E5",
            fontId: "outfit",
            density: "comfortable",
        },
    },
} as const;

export type TestInvoice = typeof VALID_INVOICE;

export function invoiceWith(
    changes: Partial<TestInvoice["details"]> = {}
): TestInvoice {
    return {
        ...VALID_INVOICE,
        details: {
            ...VALID_INVOICE.details,
            ...changes,
        },
    };
}

export const EMPTY_PAYMENT = {
    bankName: "",
    accountName: "",
    accountNumber: "",
};

export const VALID_PAYMENT = {
    bankName: "Bank Contoh",
    accountName: "PT Contoh",
    accountNumber: "1234567890",
};
