import { test, expect } from "../../support/test";

test.describe("Navigasi wizard invoice", () => {
    test("WIZ-POS-01 - Lima langkah wizard tampil", async ({ wizard }) => {
        await wizard.open();

        await expect(wizard.step(1)).toBeVisible({ timeout: 10_000 });
        await expect(wizard.step(2)).toBeVisible();
        await expect(wizard.step(3)).toBeVisible();
        await expect(wizard.step(4)).toBeVisible();
        await expect(wizard.step(5)).toBeVisible();
    });

    test("WIZ-POS-02 - Pengguna dapat berpindah dengan Next dan Back", async ({
        wizard,
    }) => {
        await wizard.open();

        await wizard.next();
        await expect(wizard.page).toHaveURL(/step=details/);

        await wizard.back();
        await expect(wizard.page).toHaveURL(/step=from-and-to/);
    });

    test("WIZ-EDGE-01 - Deep link membuka langkah yang dipilih", async ({
        wizard,
    }) => {
        await wizard.open("summary");

        await expect(wizard.page).toHaveURL(/step=summary/);
        await expect(wizard.step(5)).toHaveAttribute("aria-current", "step");
    });
});
