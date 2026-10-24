import { expect, test } from "@playwright/test";

test("the landing page explains the product and shows the shorten form", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Short links",
  );
  await expect(page.getByLabel("Destination URL")).toBeVisible();
  await expect(page.getByLabel("Domain")).toBeVisible();
  await expect(page.getByLabel("Custom alias")).toBeVisible();
});

test("the landing page lists the product features", async ({ page }) => {
  await page.goto("/#features");
  await expect(
    page.getByRole("heading", { name: "Built for links you actually keep" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Links that stay yours" }),
  ).toBeVisible();
});

test("the dashboard requires a signed-in account", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});

test("an unknown short link resolves to a friendly not-found page", async ({
  page,
}) => {
  await page.goto("/r/this-slug-does-not-exist");
  await expect(
    page.getByRole("heading", { name: "That link does not exist." }),
  ).toBeVisible();
});
