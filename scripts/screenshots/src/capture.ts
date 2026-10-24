import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const base = process.env.SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3311";
const directory = resolve(
  process.env.SCREENSHOT_DIRECTORY ?? "documentation/screenshots",
);

const shots = [
  { name: "landing-desktop", path: "/", width: 1440, height: 900 },
  { name: "landing-mobile", path: "/", width: 390, height: 844 },
  { name: "sign-in-desktop", path: "/sign-in", width: 1440, height: 900 },
  { name: "not-found-desktop", path: "/does-not-exist", width: 1440, height: 900 },
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
    () => document.styleSheets.length > 0 && document.body.offsetHeight > 0,
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `${directory}/${shot.name}.png`,
    fullPage: shot.name.includes("landing-desktop"),
  });
  console.log(`captured ${shot.name}`);
  await context.close();
}

await browser.close();
