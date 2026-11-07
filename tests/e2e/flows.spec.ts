import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function skipOnboarding(page: Page) {
  await page.goto("/vandaag");
  await expect(page).toHaveURL(/\/welkom$/);
  await page.getByRole("button", { name: "Overslaan" }).click();
  await expect(page).toHaveURL(/\/vandaag$/);
}

test.describe("landing", () => {
  test("shows the promise and leads into the app", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Houd je buikklachten bij");
    await expect(page.getByRole("heading", { name: "Je gegevens blijven van jou" })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.getByRole("link", { name: "Begin gratis met bijhouden" }).first().click();
    await expect(page).toHaveURL(/\/welkom$/);
  });

  test("mobile menu opens, navigates and closes", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Menu openen" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    const menu = page.getByRole("region", { name: "Menu" });
    await expect(menu.getByRole("link", { name: "Hoe het werkt" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Over PDS" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Privacy" })).toBeVisible();
    await menu.getByRole("link", { name: "Vragen" }).click();
    await expect(page).toHaveURL(/#vragen$/);
    await expect(menu).toBeHidden();
    // Sticky header stays on top, and the section heading lands below it (not hidden behind it).
    await page.waitForTimeout(800);
    const header = await page.locator("header.site-header").boundingBox();
    const heading = await page.getByRole("heading", { name: "Veelgestelde vragen" }).boundingBox();
    expect(header!.y).toBe(0);
    expect(heading!.y).toBeGreaterThanOrEqual(header!.height);
    await page.getByRole("button", { name: "Menu openen" }).click();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(page.getByRole("button", { name: "Menu openen" })).toBeFocused();
  });

  test("is available in English", async ({ page }) => {
    await page.goto("/en");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Track your gut symptoms");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("onboarding", () => {
  test("walks through all steps, saves favourite tags and lands on today", async ({ page }) => {
    await page.goto("/vandaag");
    await expect(page).toHaveURL(/\/welkom$/);
    await expect(page.getByRole("heading", { name: "Een dagboek voor je buik" })).toBeVisible();
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: /Volgende/ }).click();
    await expect(page.getByRole("heading", { name: "Inzicht, geen diagnose" })).toBeVisible();
    await page.getByRole("button", { name: "Begrepen" }).click();
    await page.getByRole("button", { name: "pittig" }).click();
    await page.getByRole("button", { name: /Begin met bijhouden/ }).click();
    await expect(page).toHaveURL(/\/vandaag$/);
    await expect(page.getByRole("heading", { name: "Vandaag", level: 1 })).toBeVisible();

    // Favourites show up first in the meal picker.
    await page.getByRole("button", { name: "Nieuwe invoer: Eten" }).click();
    const firstChips = page.getByRole("dialog").locator("fieldset button[aria-pressed]");
    await expect(firstChips.first()).toBeVisible();
    const labels = await firstChips.allTextContents();
    expect(labels.slice(0, 4)).toEqual(expect.arrayContaining(["ui/knoflook", "pittig"]));
  });

  test("can be skipped", async ({ page }) => {
    await skipOnboarding(page);
    await page.reload();
    await expect(page).toHaveURL(/\/vandaag$/);
  });
});

test.describe("logging", () => {
  test.beforeEach(async ({ page }) => skipOnboarding(page));

  test("logs a meal, a symptom and stress in a few taps", async ({ page }) => {
    // Meal
    const start = Date.now();
    await page.getByRole("button", { name: "Nieuwe invoer: Eten" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("Bijv. pasta pesto").fill("Pasta pesto");
    await dialog.getByRole("button", { name: "ui/knoflook" }).click();
    await dialog.getByRole("button", { name: "Opslaan" }).click();
    await expect(page.getByRole("status").getByText("Genoteerd")).toBeVisible();
    expect(Date.now() - start).toBeLessThan(15_000);

    // Symptom
    await page.getByRole("button", { name: "Nieuwe invoer: Klacht" }).click();
    await dialog.getByRole("button", { name: "opgeblazen" }).click();
    await dialog.getByRole("radiogroup", { name: "Hoe erg?" }).getByRole("radio", { name: /^7 —/ }).click();
    await dialog.getByRole("button", { name: "Opslaan" }).click();

    // Stress (anticipatory)
    await page.getByRole("button", { name: "Nieuwe invoer: Stress" }).click();
    await dialog.getByRole("radio", { name: "deadline" }).click();
    await dialog.getByRole("switch", { name: "Stress vooraf" }).click();
    await dialog.getByRole("button", { name: "Opslaan" }).click();

    const list = page.getByRole("list", { name: "Vandaag genoteerd" });
    await expect(list.getByRole("listitem")).toHaveCount(3);
    await expect(list).toContainText("Pasta pesto");
    await expect(list).toContainText("opgeblazen");
    await expect(list).toContainText("stress vooraf");
    await expect(page.getByRole("heading", { name: "Vandaag", level: 1 })).toBeVisible();
  });

  test("validates, edits and deletes with undo", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuwe invoer: Klacht" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Opslaan" }).click();
    await expect(dialog.getByText("Kies minstens één klacht")).toBeVisible();
    await dialog.getByRole("button", { name: "krampen" }).click();
    await dialog.getByRole("button", { name: "Opslaan" }).click();

    const list = page.getByRole("list", { name: "Vandaag genoteerd" });
    await list.getByRole("button").first().click();
    await expect(dialog.getByRole("heading", { name: "Klacht bewerken" })).toBeVisible();
    await dialog.getByRole("radiogroup", { name: "Hoe erg?" }).getByRole("radio", { name: /^2 —/ }).click();
    await dialog.getByRole("button", { name: "Wijziging opslaan" }).click();
    await expect(list).toContainText("licht");

    await list.getByRole("button").first().click();
    await dialog.getByRole("button", { name: "Verwijderen" }).click();
    await dialog.getByRole("button", { name: "Weet je het zeker?" }).click();
    await expect(list).toHaveCount(0);
    await page.getByRole("button", { name: "Ongedaan maken" }).click();
    await expect(page.getByRole("list", { name: "Vandaag genoteerd" }).getByRole("listitem")).toHaveCount(1);
  });

  test("records sleep for the day", async ({ page }) => {
    await page.getByRole("button", { name: "Dag bewerken" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("radio", { name: /^4 —/ }).click();
    await dialog.getByRole("button", { name: "Meer water" }).click();
    await dialog.getByRole("button", { name: "Opslaan" }).click();
    await expect(page.getByLabel("4/5")).toBeVisible();
  });

  test("timeline moves between days", async ({ page }) => {
    await page.getByRole("link", { name: "Tijdlijn" }).click();
    await expect(page.getByRole("heading", { name: "Vandaag", level: 2 })).toBeVisible();
    await page.getByRole("button", { name: "Vorige dag" }).click();
    await expect(page.getByText("Niets genoteerd op deze dag.")).toHaveCount(1);
    await page.getByRole("button", { name: "Naar vandaag" }).click();
    await expect(page.getByRole("heading", { name: "Vandaag", level: 2 })).toBeVisible();
  });

  test("insights show progress while collecting", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuwe invoer: Eten" }).click();
    await page.getByRole("dialog").getByPlaceholder("Bijv. pasta pesto").fill("Soep");
    await page.getByRole("dialog").getByRole("button", { name: "Opslaan" }).click();
    await page.getByRole("link", { name: "Inzichten" }).click();
    await expect(page.getByRole("heading", { name: "Je patroon wordt zichtbaar" })).toBeVisible();
    await expect(page.getByRole("img", { name: "1/14" })).toBeVisible();
  });
});

test.describe("data", () => {
  test.beforeEach(async ({ page }) => skipOnboarding(page));

  test("exports JSON and CSV, re-imports, and erases everything", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuwe invoer: Eten" }).click();
    await page.getByRole("dialog").getByPlaceholder("Bijv. pasta pesto").fill("Curry, met ui");
    await page.getByRole("dialog").getByRole("button", { name: "Opslaan" }).click();
    await page.getByRole("link", { name: "Instellingen" }).click();

    const [json] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Back-up maken (JSON)" }).click()]);
    expect(json.suggestedFilename()).toMatch(/^ibscalm-\d{4}-\d{2}-\d{2}\.json$/);
    const jsonPath = await json.path();
    const file = JSON.parse(await readFile(jsonPath, "utf-8"));
    expect(file.app).toBe("pds-tracker");
    expect(file.data.meals[0].description).toBe("Curry, met ui");
    await expect(page.getByText(/Laatste back-up/)).toBeVisible();

    const [csv] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /CSV/ }).click()]);
    const csvText = await readFile(await csv.path(), "utf-8");
    expect(csvText).toContain('"Curry, met ui"');

    // Erase everything
    await page.getByRole("button", { name: "Alles wissen" }).click();
    await page.getByLabel("Typ WISSEN om te bevestigen").fill("WISSEN");
    await page.getByRole("button", { name: "Definitief wissen" }).click();
    // A wiped device starts fresh at the welcome screen.
    await expect(page).toHaveURL(/\/welkom$/);

    // Restore from the backup
    await page.getByRole("button", { name: "Overslaan" }).click();
    await expect(page).toHaveURL(/\/vandaag$/);
    await page.getByRole("link", { name: "Instellingen" }).click();
    await page.getByTestId("import-input").setInputFiles(jsonPath);
    await expect(page.getByText(/Teruggezet: \d+ nieuw/)).toBeVisible();
    await page.getByRole("link", { name: "Vandaag" }).click();
    await expect(page.getByRole("list", { name: "Vandaag genoteerd" })).toContainText("Curry, met ui");
  });

  test("rejects a file that is not a backup", async ({ page }) => {
    await page.getByRole("link", { name: "Instellingen" }).click();
    await page.getByTestId("import-input").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from('{"hello":1}') });
    await expect(page.getByText("Dit is geen back-up van IBSCalm.")).toBeVisible();
  });
});
