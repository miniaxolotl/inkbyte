import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("public pages meet core WCAG accessibility checks", async ({ page }) => {
  for (const path of [
    "/",
    "/help",
    "/privacy",
    "/sign-in",
    "/sign-up",
    "/b/fixture",
    "/visit/campaign?domain=inkbyte.app",
    "/missing-accessibility-fixture",
  ]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations,
      `${path}: ${JSON.stringify(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })))}`,
    ).toEqual([]);
  }
});

test("privacy dialog is keyboard accessible and restores focus", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "Privacy & analytics" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", {
    name: "Website analytics preferences",
  });
  await expect(dialog).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
