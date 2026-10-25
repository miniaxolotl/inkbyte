import { expect, test } from "@playwright/test";

for (const [path, title] of [
  ["/", "InkByte — short links with real analytics"],
  ["/help", "Help | InkByte"],
  ["/privacy", "Privacy | InkByte"],
  ["/sign-in", "Sign in | InkByte"],
  ["/sign-up", "Create an account | InkByte"],
  ["/b/fixture", "Link in bio | InkByte"],
  ["/visit/campaign?domain=inkbyte.app", "Continue to your link | InkByte"],
]) {
  test(`${path} has complete branded metadata`, async ({ page }) => {
    await page.goto(path!);
    await expect(page).toHaveTitle(title!);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S.{20,}/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      title!,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/assets\/brand\/social-card\.png$/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(
      page.locator('link[rel="icon"][type="image/svg+xml"]'),
    ).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    const canonical = page.locator('link[rel="canonical"]');
    if (["/", "/help", "/privacy"].includes(path!)) {
      const expected = new URL(path!, page.url()).toString().replace(/\/$/, "");
      await expect(canonical).toHaveAttribute(
        "href",
        new RegExp(`^${expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/?$`),
      );
    } else {
      await expect(canonical).toHaveCount(0);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    }
  });
}

test("brand assets are real images and the manifest uses local icons", async ({
  request,
}) => {
  for (const path of [
    "/favicon.ico",
    "/apple-icon.png",
    "/icon.svg",
    "/assets/brand/icon-192.png",
    "/assets/brand/icon-512.png",
    "/assets/brand/social-card.png",
  ]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    expect(response.headers()["content-type"]).toMatch(/^image\//);
    expect((await response.body()).length).toBeGreaterThan(100);
  }
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe("InkByte");
  expect(manifest.icons.map((icon: { sizes: string }) => icon.sizes)).toEqual([
    "192x192",
    "512x512",
  ]);
  for (const [path, width, height] of [
    ["/apple-icon.png", 180, 180],
    ["/assets/brand/icon-192.png", 192, 192],
    ["/assets/brand/icon-512.png", 512, 512],
    ["/assets/brand/social-card.png", 1200, 630],
  ] as const) {
    const image = await request.get(path);
    const bytes = await image.body();
    expect(bytes.readUInt32BE(16)).toBe(width);
    expect(bytes.readUInt32BE(20)).toBe(height);
  }
});

test("metadata never reflects queries or destinations, and private routes stay gated", async ({
  page,
}) => {
  for (const path of [
    "/help?token=private-fixture",
    "/sign-in?redirect_url=https://example.com/private-fixture",
    "/dashboard",
    "/dashboard/bio",
    "/dashboard/links/00000000-0000-0000-0000-000000000001",
  ]) {
    await page.goto(path);
    if (path.startsWith("/dashboard")) {
      await page.waitForURL(/\/sign-in/);
      await expect(page).toHaveTitle("Sign in | InkByte");
    }
    const tags = await page
      .locator("meta, link[rel=canonical]")
      .evaluateAll((nodes) => nodes.map((node) => node.outerHTML).join("\n"));
    expect(tags).not.toContain("private-fixture");
    if (path.startsWith("/dashboard")) {
      await expect(page).toHaveURL(/\/sign-in/);
      await expect(page).toHaveTitle("Sign in | InkByte");
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    }
  }
});

test("short-link errors retain favicon and privacy metadata", async ({
  page,
}) => {
  const response = await page.goto("/missing-metadata-fixture");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Link not found | InkByte");
  await expect(page.locator('meta[name="description"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/favicon.ico",
  );
});

test("corrupt or unsafe local history cannot break the shortener", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "inkbyte:link-history",
      JSON.stringify({ not: "an array" }),
    );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Show history" }).click();
  await expect(page.getByRole("status")).toContainText("Links you create");
});

test("unsafe history entries are ignored while same-alias domains remain independent", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "inkbyte:link-history",
      JSON.stringify([
        {
          shortUrl: "javascript:alert(1)",
          longUrl: "https://example.com",
          domain: "inkbyte.app",
          slug: "unsafe",
        },
        {
          shortUrl: "https://inkbyte.app/shared",
          longUrl: "https://example.com",
          domain: "inkbyte.app",
          slug: "shared",
        },
        {
          shortUrl: "https://inkbyte.co/shared",
          longUrl: "https://example.com",
          domain: "inkbyte.co",
          slug: "shared",
        },
      ]),
    );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Show history" }).click();
  await expect(page.locator('a[href^="javascript:"]')).toHaveCount(0);
  await page
    .getByRole("button", { name: "Remove shared from history" })
    .first()
    .click();
  await expect(
    page.getByRole("link", { name: "https://inkbyte.co/shared", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "https://inkbyte.app/shared", exact: true }),
  ).toHaveCount(0);
});

test("missing bio pages have an accurate error title without a canonical", async ({
  page,
}) => {
  await page.goto("/b/missing");
  await expect(page).toHaveTitle("Page not found | InkByte");
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("an API outage shows a branded retry page, not a broken redirect", async ({
  page,
}) => {
  const response = await page.goto("/unavailable");
  expect(response?.status()).toBe(503);
  expect(response?.headers()["retry-after"]).toBe("30");
  await expect(page).toHaveTitle("Temporarily unavailable | InkByte");
  await expect(page.getByRole("link", { name: "Try again" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});
