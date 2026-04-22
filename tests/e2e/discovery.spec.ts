import { test, expect } from "@playwright/test";

test.describe("discovery deck", () => {
  test("setup → deck → slide navigation", async ({ page }) => {
    await page.goto(
      "/discovery/setup?company=Acme&name=Priya&cs1=professional-services-lead-to-cash&cs2=auto-parts-distribution-order-automation&kickoff=2026-04-27&contactId=t1&phone=%2B919876543210"
    );
    await expect(page).toHaveURL(/\/discovery$/);
    await expect(page.getByText("Acme")).toBeVisible();

    // Advance to slide 12 via keyboard
    for (let i = 0; i < 11; i++) {
      await page.keyboard.press("ArrowRight");
    }
    await expect(page.getByText(/Reserve.*25K/i)).toBeVisible();
  });

  test("export mode hides presenter chrome", async ({ page }) => {
    await page.goto(
      "/discovery/setup?company=Acme&name=Priya&cs1=&cs2=&kickoff=2026-04-27&contactId=t1&phone=%2B919876543210"
    );
    await expect(page).toHaveURL(/\/discovery$/);
    await page.goto("/discovery?export=true");
    await expect(page.getByRole("navigation", { name: /deck nav/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /copy recap/i })).toHaveCount(0);
  });

  test("privacy policy page loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /privacy policy/i })).toBeVisible();
    await expect(page.getByText(/grievance officer/i).first()).toBeVisible();
  });
});
