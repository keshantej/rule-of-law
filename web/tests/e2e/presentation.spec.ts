import { expect, test } from "@playwright/test";

test("presentation route shows a scene heading", async ({ page }) => {
  await page.goto("/presentation");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("speaker route exposes presenter view label", async ({ page }) => {
  await page.goto("/presentation/speaker");
  await expect(page.getByText("Presenter view")).toBeVisible();
});

test("standalone route exposes standalone presentation label", async ({ page }) => {
  await page.goto("/presentation/standalone");
  await expect(page.getByText("Standalone presentation")).toBeVisible();
});

test("presenter route includes presenter workspace heading", async ({ page }) => {
  await page.goto("/presenter");
  await expect(page.getByRole("heading", { name: /Prepare the talk, choose a timed format/i })).toBeVisible();
});

test("certification route includes certification heading", async ({ page }) => {
  await page.goto("/certification");
  await expect(page.getByRole("heading", { name: /Review the training modules, lesson content/i })).toBeVisible();
});
