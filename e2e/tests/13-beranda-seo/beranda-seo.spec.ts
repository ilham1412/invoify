import { test, expect } from "../../support/test";

test.describe("Beranda dan SEO", () => {
    test("HOME-POS-01 - Beranda menampilkan judul utama dan navigasi", async ({
        beranda,
    }) => {
        await beranda.open();

        await expect(beranda.heading).toBeVisible({ timeout: 10_000 });
        await expect(beranda.logo).toBeVisible();
        await expect(beranda.navbar.first()).toBeVisible();
    });

    test("HOME-POS-02 - Halaman guide dapat dibuka", async ({ beranda }) => {
        await beranda.openGuide();

        await expect(beranda.heading).toBeVisible({ timeout: 10_000 });
        await expect(beranda.page).toHaveURL(/\/en\/guide$/);
    });

    test("HOME-POS-03 - Beranda menampilkan konten FAQ", async ({ beranda }) => {
        await beranda.open();

        await expect(beranda.faqSection).toBeVisible({ timeout: 10_000 });
    });

    test("HOME-EDGE-01 - Halaman guide memiliki judul berbeda dari beranda", async ({
        beranda,
    }) => {
        await beranda.open();
        const homeTitle = await beranda.heading.textContent();

        await beranda.openGuide();
        const guideTitle = await beranda.heading.textContent();

        expect(guideTitle).not.toBe(homeTitle);
    });

    test("SEO-POS-01 - Beranda memiliki meta description", async ({ beranda }) => {
        await beranda.open();

        await expect(beranda.metadataDescription).toHaveAttribute("content", /.+/, {
            timeout: 10_000,
        });
    });

    test("SEO-POS-02 - Berkas SEO utama dapat diakses", async ({ beranda }) => {
        await beranda.open();

        const sitemap = await beranda.page.request.get("/sitemap.xml");
        const robots = await beranda.page.request.get("/robots.txt");
        const manifest = await beranda.page.request.get("/manifest.webmanifest");

        expect(sitemap.ok()).toBeTruthy();
        expect(robots.ok()).toBeTruthy();
        expect(manifest.ok()).toBeTruthy();
    });

    test("SEO-POS-03 - Beranda menyediakan structured data FAQ", async ({
        beranda,
    }) => {
        await beranda.open();

        /*
         * `<script>` is display:none, so visibility is not a meaningful
         * assertion here. Assert the payload instead: a FAQPage schema with
         * at least one question.
         */
        await expect(beranda.jsonLdScripts.first()).toBeAttached({
            timeout: 10_000,
        });

        const schemas = await beranda.structuredData();
        const faqSchema = schemas.find(
            (schema) => schema["@type"] === "FAQPage"
        );

        expect(faqSchema).toBeDefined();
        expect((faqSchema?.mainEntity as unknown[]).length).toBeGreaterThan(0);
    });

    test("SEO-NEG-01 - Rute guide yang tidak tersedia menghasilkan 404", async ({
        beranda,
    }) => {
        const response = await beranda.page.goto("/en/rute-tidak-ada");

        expect(response?.status()).toBe(404);
    });

    test("SEO-EDGE-01 - Metadata halaman guide memiliki deskripsi", async ({
        beranda,
    }) => {
        await beranda.openGuide();

        await expect(beranda.metadataDescription).toHaveAttribute("content", /.+/, {
            timeout: 10_000,
        });
    });
});
