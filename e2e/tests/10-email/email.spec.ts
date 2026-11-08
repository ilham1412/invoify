import { test, expect } from "../../support/test";

test.describe("Pengiriman invoice melalui email", () => {
    test.setTimeout(90_000);

    test("EMAIL-NEG-01 - Email kosong ditolak", async ({ alurPenuh, shell, pdf, email }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await email.sendButton.click();
        await email.sendPdfButton.click();

        await expect(email.invalidEmailMessage).toBeVisible({ timeout: 10_000 });
    });

    test("EMAIL-NEG-02 - Format email yang salah ditolak", async ({ alurPenuh, shell, pdf, email }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await email.sendButton.click();
        await email.emailInput.fill("email-salah");
        await email.sendPdfButton.click();

        await expect(email.invalidEmailMessage).toBeVisible({ timeout: 10_000 });
    });

    test("EMAIL-POS-01 - Modal pengiriman email dapat dibuka", async ({
        alurPenuh,
        shell,
        pdf,
        email,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await email.sendButton.click();

        await expect(email.emailInput).toBeVisible({ timeout: 10_000 });
        await expect(email.sendPdfButton).toBeVisible();
    });

    test("EMAIL-EDGE-01 - Email dengan spasi di awal diterima", async ({
        alurPenuh,
        shell,
        pdf,
        email,
        page,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await email.sendButton.click();
        await email.emailInput.fill(" user@example.com");
        await email.sendPdfButton.click();

        await expect(page.getByText("send to mail")).toBeVisible({ timeout: 10_000 });
    });

    test("EMAIL-EDGE-02 - Modal email dapat ditutup tanpa mengirim", async ({
        alurPenuh,
        shell,
        pdf,
        email,
    }) => {
        await alurPenuh.fillValidInvoice();
        await shell.generatePdfButton.click();
        await expect(pdf.finalPdf).toBeVisible({ timeout: 60_000 });

        await email.sendButton.click();
        await email.emailInput.fill("recipient@example.com");
        await email.page.keyboard.press("Escape");

        await expect(email.emailDialog).toBeHidden();
    });
});
