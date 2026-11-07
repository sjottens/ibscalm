/**
 * Usability acceptance tests — measurable criteria from docs/usability.md (ISO 9241-11:2018).
 * Effectiveness: core tasks complete correctly. Efficiency: number of actions and time per task.
 * Plus supporting ergonomic criteria (ISO 9241-110 / WCAG 2.2): keyboard operation, target size, legibility.
 */
import { expect, test, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/vandaag");
  await page.getByRole("button", { name: "Overslaan" }).click();
  await expect(page).toHaveURL(/\/vandaag$/);
}

/** Counts user actions (clicks + key presses that change something) during a task. */
function counter(page: Page) {
  let n = 0;
  return {
    click: async (loc: ReturnType<Page["getByRole"]>) => {
      n++;
      await loc.click();
    },
    get count() {
      return n;
    },
    page,
  };
}

test.describe("efficiency (ISO 9241-11 §3.1.13)", () => {
  test.beforeEach(async ({ page }) => start(page));

  test("stress with default values: 2 actions, under 10 s", async ({ page }) => {
    const c = counter(page);
    const t0 = Date.now();
    await c.click(page.getByRole("button", { name: "Nieuwe invoer: Stress" }));
    await c.click(page.getByRole("dialog").getByRole("button", { name: "Opslaan" }));
    await expect(page.getByRole("list", { name: "Vandaag genoteerd" }).getByRole("listitem")).toHaveCount(1);
    expect(c.count).toBeLessThanOrEqual(2);
    expect(Date.now() - t0).toBeLessThan(10_000);
  });

  test("repeat a recent meal: 3 actions", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuwe invoer: Eten" }).click();
    await page.getByRole("dialog").getByPlaceholder("Bijv. pasta pesto").fill("Havermout");
    await page.getByRole("dialog").getByRole("button", { name: "Opslaan" }).click();

    const c = counter(page);
    await c.click(page.getByRole("button", { name: "Nieuwe invoer: Eten" }));
    await c.click(page.getByRole("dialog").getByRole("button", { name: "Havermout" }));
    await c.click(page.getByRole("dialog").getByRole("button", { name: "Opslaan" }));
    await expect(page.getByRole("list", { name: "Vandaag genoteerd" }).getByRole("listitem")).toHaveCount(2);
    expect(c.count).toBeLessThanOrEqual(3);
  });

  test("symptom with type and severity: 4 actions, under 15 s", async ({ page }) => {
    const c = counter(page);
    const t0 = Date.now();
    await c.click(page.getByRole("button", { name: "Nieuwe invoer: Klacht" }));
    const d = page.getByRole("dialog");
    await c.click(d.getByRole("button", { name: "buikpijn" }));
    await c.click(d.getByRole("radiogroup", { name: "Hoe erg?" }).getByRole("radio", { name: /^6 —/ }));
    await c.click(d.getByRole("button", { name: "Opslaan" }));
    await expect(page.getByRole("list", { name: "Vandaag genoteerd" })).toContainText("buikpijn");
    expect(c.count).toBeLessThanOrEqual(4);
    expect(Date.now() - t0).toBeLessThan(15_000);
  });
});

test.describe("effectiveness & error tolerance (ISO 9241-11 §3.1.12, ISO 9241-110)", () => {
  test.beforeEach(async ({ page }) => start(page));

  test("cancelling an entry saves nothing", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuwe invoer: Eten" }).click();
    await page.getByRole("dialog").getByPlaceholder("Bijv. pasta pesto").fill("Niet opslaan");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("Niet opslaan")).toHaveCount(0);
  });

  test("an incomplete entry explains what is missing instead of failing silently", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuwe invoer: Eten" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Opslaan" }).click();
    await expect(page.getByRole("dialog").getByText("Vul in wat je at, of kies een tag")).toBeVisible();
    await expect(page.getByRole("dialog").getByPlaceholder("Bijv. pasta pesto")).toHaveAttribute("aria-invalid", "true");
  });

  test("the whole symptom task works with the keyboard only", async ({ page }) => {
    await page.getByRole("button", { name: "Nieuwe invoer: Klacht" }).focus();
    await page.keyboard.press("Enter");
    const d = page.getByRole("dialog");
    await d.getByRole("button", { name: "krampen" }).focus();
    await page.keyboard.press("Space");
    const severity = d.getByRole("radiogroup", { name: "Hoe erg?" });
    await severity.getByRole("radio", { checked: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(severity.getByRole("radio", { name: /^6 —/ })).toHaveAttribute("aria-checked", "true");
    await d.getByRole("button", { name: "Opslaan" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("list", { name: "Vandaag genoteerd" })).toContainText("krampen");
  });
});

test.describe("ergonomics", () => {
  test("interactive targets on the main screens are at least 44×44 px", async ({ page }) => {
    await start(page);
    for (const path of ["/vandaag", "/tijdlijn", "/instellingen"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("main button, main a, nav a")]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
          .map(({ el, r }) => `${el.textContent?.trim() || el.getAttribute("aria-label")} ${Math.round(r.width)}×${Math.round(r.height)}`),
      );
      expect(small, `${path}: ${small.join(", ")}`).toEqual([]);
    }
  });

  test("running text (paragraphs over 60 characters) is at least 16 px", async ({ page }) => {
    for (const path of ["/", "/privacy"]) {
      await page.goto(path);
      const sizes = await page.evaluate(() =>
        [...document.querySelectorAll("main p")]
          .filter((p) => (p.textContent ?? "").trim().length > 60)
          .map((p) => parseFloat(getComputedStyle(p).fontSize)),
      );
      expect(sizes.length).toBeGreaterThan(0);
      expect(Math.min(...sizes)).toBeGreaterThanOrEqual(16);
    }
  });
});
