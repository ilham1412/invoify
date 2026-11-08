import { type Page } from "@playwright/test";
import { ShellPage } from "./shell.page";
import { WizardPage } from "./wizard.page";
import { PengirimPenerimaPage } from "./pengirim-penerima.page";
import { DetailInvoicePage } from "./detail-invoice.page";
import { ItemPage } from "./item.page";
import { PembayaranPage } from "./pembayaran.page";
import { RingkasanPage } from "./ringkasan.page";

export class AlurPenuhPage {
    readonly shell: ShellPage;
    readonly wizard: WizardPage;
    readonly pengirimPenerima: PengirimPenerimaPage;
    readonly detailInvoice: DetailInvoicePage;
    readonly item: ItemPage;
    readonly pembayaran: PembayaranPage;
    readonly ringkasan: RingkasanPage;

    constructor(page: Page) {
        this.shell = new ShellPage(page);
        this.wizard = new WizardPage(page);
        this.pengirimPenerima = new PengirimPenerimaPage(page);
        this.detailInvoice = new DetailInvoicePage(page);
        this.item = new ItemPage(page);
        this.pembayaran = new PembayaranPage(page);
        this.ringkasan = new RingkasanPage(page);
    }

    async fillValidInvoice(): Promise<void> {
        await this.wizard.open();
        await this.pengirimPenerima.senderName.fill("PT E2E Contoh");
        await this.pengirimPenerima.field("sender", "address").fill("Jl. Merdeka No. 10");
        await this.pengirimPenerima.field("sender", "zipCode").fill("10110");
        await this.pengirimPenerima.field("sender", "city").fill("Jakarta");
        await this.pengirimPenerima.field("sender", "country").fill("Indonesia");
        await this.pengirimPenerima.senderEmail.fill("sender@example.com");
        await this.pengirimPenerima.field("sender", "phone").fill("081234567890");
        await this.pengirimPenerima.receiverName.fill("PT Klien E2E");
        await this.pengirimPenerima.field("receiver", "address").fill("Jl. Sudirman No. 20");
        await this.pengirimPenerima.field("receiver", "zipCode").fill("10220");
        await this.pengirimPenerima.field("receiver", "city").fill("Bandung");
        await this.pengirimPenerima.field("receiver", "country").fill("Indonesia");
        await this.pengirimPenerima.receiverEmail.fill("client@example.com");
        await this.pengirimPenerima.field("receiver", "phone").fill("081345678901");

        await this.wizard.next();

        await this.detailInvoice.invoiceNumber.fill("INV-2026-001");
        await this.detailInvoice.issueDate.click();
        await this.detailInvoice.calendarDayButtons.filter({ hasText: /^15$/ }).first().click();
        await this.detailInvoice.dueDate.click();
        await this.detailInvoice.calendarDayButtons.filter({ hasText: /^15$/ }).first().click();

        await this.wizard.next();

        await this.item.itemField(0, "name").fill("Jasa Konsultasi");
        await this.item.itemField(0, "quantity").fill("2");
        await this.item.itemField(0, "unitPrice").fill("500000");

        await this.wizard.next();

        await this.pembayaran.fill("Bank Indonesia", "PT E2E Contoh", "1234567890");

        await this.wizard.next();

        await this.ringkasan.paymentTerms.fill("Net 30");
    }
}
