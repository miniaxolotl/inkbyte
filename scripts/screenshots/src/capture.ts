import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const base = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3311";
const directory = resolve(
  process.env.SCREENSHOT_DIRECTORY ??
    fileURLToPath(
      new URL("../../../documentation/screenshots", import.meta.url),
    ),
);

const shots = [
  { name: "landing-desktop", path: "/", width: 1440, height: 900 },
  { name: "landing-mobile", path: "/", width: 390, height: 844 },
  { name: "features-desktop", path: "/", width: 1440, height: 1000 },
  { name: "help-desktop", path: "/help", width: 1440, height: 900 },
  { name: "privacy-desktop", path: "/privacy", width: 1440, height: 900 },
  { name: "bio-desktop", path: "/b/inkbyte-demo", width: 1440, height: 900 },
  { name: "cta-desktop", path: "/demo-cta", width: 1440, height: 900 },
  { name: "sign-in-desktop", path: "/sign-in", width: 1440, height: 900 },
  {
    name: "not-found-desktop",
    path: "/visit/does-not-exist",
    width: 1440,
    height: 900,
  },
];

await mkdir(directory, { recursive: true });
const browser = await chromium.launch();

for (const shot of shots) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(`${base}${shot.path}`, { waitUntil: "load" });
  // Wait for the stylesheet to be applied, not just downloaded.
  await page.waitForFunction(
    () =>
      getComputedStyle(document.documentElement).backgroundColor ===
      "rgb(242, 242, 242)",
  );
  await page.evaluate(() => document.fonts.ready);
  if (shot.name === "features-desktop")
    await page
      .locator('section[aria-labelledby="features-title"]')
      .evaluate((element) => element.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${directory}/${shot.name}.png`,
    fullPage: shot.name.includes("desktop") && shot.name !== "features-desktop",
  });
  console.log(`captured ${shot.name}`);
  await context.close();
}

await browser.close();
