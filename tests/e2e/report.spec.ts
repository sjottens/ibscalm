import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function startWithEntry(page: Page) {
  await page.goto("/vandaag");
  await page.getByRole("button", { name: "Overslaan" }).click();
  await page.getByRole("button", { name: "Nieuwe invoer: Klacht" }).click();
  const d = page.getByRole("dialog");
  await d.getByRole("button", { name: "opgeblazen" }).click();
  await d.getByRole("button", { name: "Opslaan" }).click();
  await expect(page.getByRole("list", { name: "Vandaag genoteerd" }).getByRole("listitem")).toHaveCount(1);
}

test.describe("doctor's report (iDEAL)", () => {
  test("pay with iDEAL, return, and download the PDF", async ({ page }) => {
    await startWithEntry(page);
    await page.getByRole("link", { name: "Inzichten" }).click();
    await page.getByRole("link", { name: /Rapport voor je arts/ }).click();
    await expect(page.getByRole("heading", { name: "Rapport voor je arts", level: 1 })).toBeVisible();
    await expect(page.getByText("Eenmalig")).toBeVisible();

    await page.getByRole("button", { name: /Betaal met iDEAL/ }).click();
    await expect(page).toHaveURL(/\/betaling-test\?id=mock_/);
    await page.getByRole("link", { name: "Betaling geslaagd" }).click();

    await expect(page).toHaveURL(/\/rapport$/);
    await expect(page.getByRole("heading", { name: "Rapport ontgrendeld" })).toBeVisible();
    await expect(page.getByText(/Betaalkenmerk: mock_/)).toBeVisible();

    await page.getByRole("radio", { name: "Laatste 2 weken" }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download PDF" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^ibscalm-rapport-\d{4}-\d{2}-\d{2}\.pdf$/);
    const pdf = await readFile(await download.path());
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");

    // The unlock survives a reload (stored on the device).
    await page.reload();
    await expect(page.getByRole("heading", { name: "Rapport ontgrendeld" })).toBeVisible();
  });

  test("a failed payment keeps the report locked and explains why", async ({ page }) => {
    await startWithEntry(page);
    await page.goto("/rapport");
    await page.getByRole("button", { name: /Betaal met iDEAL/ }).click();
    await page.getByRole("link", { name: "Betaling mislukt" }).click();
    await expect(page).toHaveURL(/\/rapport$/);
    await expect(page.getByText("De betaling is niet gelukt of geannuleerd.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Betaal met iDEAL/ })).toBeVisible();
  });

  test("the payment request contains no health data", async ({ page }) => {
    await startWithEntry(page);
    await page.goto("/rapport");
    const [req] = await Promise.all([
      page.waitForRequest((r) => r.url().endsWith("/api/checkout") && r.method() === "POST"),
      page.getByRole("button", { name: /Betaal met iDEAL/ }).click(),
    ]);
    expect(JSON.parse(req.postData() ?? "{}")).toEqual({ locale: "nl" });
  });
});
