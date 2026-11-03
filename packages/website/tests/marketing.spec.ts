import { expect, test } from "@playwright/test";

test("Vercel scripts require consent and stay off private link pages", async ({
  page,
}) => {
  test.skip(
    process.env.NEXT_PUBLIC_VERCEL_INSIGHTS_ENABLED !== "true",
    "Enable the integration in the production build to exercise consent.",
  );
  const scripts: string[] = [];
  await page.route("**/_vercel/**", (route) => {
    scripts.push(route.request().url());
    return route.fulfill({
      contentType: "text/javascript",
      body: "/* analytics test fixture */",
    });
  });
  await page.goto("/");
  expect(scripts).toHaveLength(0);
  await page.getByRole("button", { name: "Privacy & analytics" }).click();
  await page.getByRole("button", { name: "Allow website analytics" }).click();
  await expect
    .poll(() => scripts.some((url) => url.includes("/insights/")))
    .toBe(true);
  await expect
    .poll(() => scripts.some((url) => url.includes("/speed-insights/")))
    .toBe(true);
  const count = scripts.length;
  await page.goto("/b/fixture");
  expect(scripts).toHaveLength(count);
});

test("browser privacy signals override saved website analytics consent", async ({
  page,
}) => {
  const scripts: string[] = [];
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "globalPrivacyControl", {
      value: true,
      configurable: true,
    });
    localStorage.setItem("inkbyte:website-analytics:v1", "allowed");
  });
  await page.route("**/_vercel/**", (route) => {
    scripts.push(route.request().url());
    return route.fulfill({ contentType: "text/javascript", body: "" });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Privacy & analytics" }).click();
  await expect(
    page.getByRole("button", { name: "Allow website analytics" }),
  ).toBeDisabled();
  expect(scripts).toHaveLength(0);
});

test("canonical and legacy short URLs resolve on the website", async ({
  request,
}) => {
  for (const path of ["/fixture", "/l/fixture", "/r/fixture"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe("https://example.com/fixture");
    expect(response.headers()["set-cookie"]).toContain("inkbyte_vid=");
  }
});

test("CTA links count the visit before displaying the interstitial", async ({
  request,
  page,
}) => {
  const response = await request.get("/campaign", { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toContain("/visit/campaign");
  await page.goto(response.headers().location!);
  await expect(
    page.getByRole("heading", { name: "A note before you go" }),
  ).toBeVisible();
  const action = page.getByRole("link", { name: "Continue" });
  expect(await action.getAttribute("href")).toContain("e=cta_click");
});

test("the landing page shows the logo and the shorten form", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("img", { name: "InkByte" })).toBeVisible();
  await expect(page.getByLabel("Shorten a URL")).toBeVisible();
  await expect(page.getByLabel("Domain")).not.toBeVisible();
  await page.locator("summary").filter({ hasText: "Link options" }).click();
  await expect(page.getByLabel("Domain")).toBeVisible();
  await expect(page.getByLabel("Custom alias")).toBeVisible();
  await page.locator("summary").filter({ hasText: "Call to action" }).click();
  await expect(page.getByLabel("Call to action")).toBeVisible();
});

test("the landing page explains its benefits without a hidden feature panel", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A little link/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Links you can remember" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A QR code when you need it" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your favourites, together" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "See what gets opened" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "How it works", exact: true }).click();
  await expect(page).toHaveURL(/#how-it-works$/);
  await expect(
    page.getByRole("link", { name: "Create your account", exact: true }),
  ).toHaveAttribute("href", "/sign-up");
});

test("help stays short and consumer-friendly", async ({ page }) => {
  await page.goto("/help");
  await expect(
    page.getByRole("heading", { name: "A little help with your links." }),
  ).toBeVisible();
  const main = page.locator("main");
  await expect(main.locator("details")).toHaveCount(6);
  expect(await main.textContent()).not.toMatch(
    /\b(HEAD|HMAC|JWKS|PostgreSQL|Clerk|fingerprint|interstitial|referrer)\b/i,
  );
  await page.getByText("Can I use a QR code?", { exact: true }).click();
  await expect(page.getByText(/Use it on a poster, invitation/)).toBeVisible();
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

test("public bio items retain the domain of their underlying short link", async ({
  page,
}) => {
  await page.goto("/b/fixture");
  await expect(
    page.getByRole("heading", { name: "Example creator" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Visit my website" }),
  ).toHaveAttribute("href", "/r/fixture?domain=inkbyte.app");
});

test("public pages fit a narrow phone without horizontal scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of [
    "/",
    "/help",
    "/privacy",
    "/sign-in",
    "/sign-up",
    "/b/fixture",
    "/visit/campaign?domain=inkbyte.app",
  ]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      path,
    ).toBe(true);
  }
});

test("empty history explains where created links will appear", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Show history" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Links you create in this browser",
  );
});
