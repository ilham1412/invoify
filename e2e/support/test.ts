import fs from "node:fs";
import path from "node:path";
import { test as base, expect } from "@playwright/test";
import { BahasaPage } from "../pages/bahasa.page";
import { AlurPenuhPage } from "../pages/alur-penuh.page";
import { BerandaPage } from "../pages/beranda.page";
import { DetailInvoicePage } from "../pages/detail-invoice.page";
import { EmailPage } from "../pages/email.page";
import { EksporImporPage } from "../pages/ekspor-impor.page";
import { InvoiceTersimpanPage } from "../pages/invoice-tersimpan.page";
import { ItemPage } from "../pages/item.page";
import { PembayaranPage } from "../pages/pembayaran.page";
import { PengirimPenerimaPage } from "../pages/pengirim-penerima.page";
import { PenyimpananPage } from "../pages/penyimpanan.page";
import { PdfPage } from "../pages/pdf.page";
import { PratinjauPage } from "../pages/pratinjau.page";
import { RingkasanPage } from "../pages/ringkasan.page";
import { ShellPage } from "../pages/shell.page";
import { WizardPage } from "../pages/wizard.page";
import { collectProblems } from "./problems";

export type TestFixtures = {
    shell: ShellPage;
    alurPenuh: AlurPenuhPage;
    wizard: WizardPage;
    pengirimPenerima: PengirimPenerimaPage;
    detailInvoice: DetailInvoicePage;
    item: ItemPage;
    pembayaran: PembayaranPage;
    ringkasan: RingkasanPage;
    pratinjau: PratinjauPage;
    pdf: PdfPage;
    invoiceTersimpan: InvoiceTersimpanPage;
    eksporImpor: EksporImporPage;
    email: EmailPage;
    bahasa: BahasaPage;
    penyimpanan: PenyimpananPage;
    beranda: BerandaPage;
    problems: string[];
    coverage: void;
};

export const test = base.extend<TestFixtures>({
    shell: async ({ page }, register) => register(new ShellPage(page)),
    alurPenuh: async ({ page }, register) => register(new AlurPenuhPage(page)),
    wizard: async ({ page }, register) => register(new WizardPage(page)),
    pengirimPenerima: async ({ page }, register) =>
        register(new PengirimPenerimaPage(page)),
    detailInvoice: async ({ page }, register) =>
        register(new DetailInvoicePage(page)),
    item: async ({ page }, register) => register(new ItemPage(page)),
    pembayaran: async ({ page }, register) => register(new PembayaranPage(page)),
    ringkasan: async ({ page }, register) => register(new RingkasanPage(page)),
    pratinjau: async ({ page }, register) => register(new PratinjauPage(page)),
    pdf: async ({ page }, register) => register(new PdfPage(page)),
    invoiceTersimpan: async ({ page }, register) =>
        register(new InvoiceTersimpanPage(page)),
    eksporImpor: async ({ page }, register) => register(new EksporImporPage(page)),
    email: async ({ page }, register) => register(new EmailPage(page)),
    bahasa: async ({ page }, register) => register(new BahasaPage(page)),
    penyimpanan: async ({ page }, register) => register(new PenyimpananPage(page)),
    beranda: async ({ page }, register) => register(new BerandaPage(page)),
    problems: async ({ page }, register) => {
        const problems: string[] = [];
        collectProblems(page, problems);
        await register(problems);
    },
    /*
     * Opt-in V8 coverage recorder for the TIA experiment. With COVERAGE unset
     * this fixture is a no-op, so normal Playwright runs keep their original
     * timing and behaviour.
     */
    coverage: [
        async ({ page }, use, testInfo) => {
            if (process.env.COVERAGE !== "1") {
                await use();
                return;
            }

            let started = false;
            try {
                await page.coverage.startJSCoverage({
                    resetOnNavigation: false,
                    reportAnonymousScripts: false,
                });
                started = true;
            } catch (error) {
                console.warn(
                    `[coverage] could not start JS coverage for "${testInfo.title}": ${String(error)}`,
                );
            }

            await use();

            if (!started) return;

            try {
                const coverage = await page.coverage.stopJSCoverage();

                const relativeSpec = path
                    .relative(process.cwd(), testInfo.file)
                    .replace(/\\/g, "/");
                const specSlug = relativeSpec
                    .replace(/^e2e\/tests\//, "")
                    .replace(/\.spec\.[jt]sx?$/, "")
                    .replace(/[\\/]+/g, "__");
                const safeTitle = testInfo.title
                    .replace(/[^a-zA-Z0-9._-]+/g, "-")
                    .replace(/^-+|-+$/g, "")
                    .slice(0, 80);
                const rawRoot = path.resolve(
                    process.env.COVERAGE_RAW_DIR || "coverage-raw",
                );
                const outputDir = path.join(rawRoot, specSlug);
                fs.mkdirSync(outputDir, { recursive: true });
                const outputFile = path.join(
                    outputDir,
                    `${testInfo.testId}-${safeTitle || "test"}.json`,
                );
                fs.writeFileSync(outputFile, JSON.stringify(coverage));
            } catch (error) {
                console.warn(
                    `[coverage] could not save JS coverage for "${testInfo.title}": ${String(error)}`,
                );
            }
        },
        { auto: true },
    ],
});

export { expect };
