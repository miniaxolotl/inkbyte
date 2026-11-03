import { chromium } from "@playwright/test";
import sharp from "sharp";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const website = fileURLToPath(
  new URL("../../../packages/website/", import.meta.url),
);
const app = resolve(website, "src/app");
const assets = resolve(website, "public/assets/brand");
const source = await readFile(
  resolve(website, "public/assets/logo/default.svg"),
);
await mkdir(assets, { recursive: true });

// Derive every icon from the original artwork, never a replacement brand mark.
async function icon(size: number) {
  const padding = Math.round(size * 0.1);
  return sharp(source)
    .trim()
    .resize(size - padding * 2, size - padding * 2, {
      fit: "contain",
      background: "#f2f2f2",
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: "#f2f2f2",
    })
    .flatten({ background: "#f2f2f2" })
    .png()
    .toBuffer();
}
await writeFile(resolve(app, "icon.svg"), source);
await writeFile(resolve(app, "apple-icon.png"), await icon(180));
for (const size of [192, 512])
  await writeFile(resolve(assets, `icon-${size}.png`), await icon(size));

// ICO directory containing 16/32/48px PNG frames, supported by modern browsers.
const sizes = [16, 32, 48];
const frames = await Promise.all(
  sizes.map(async (size) =>
    sharp(await icon(size))
      .ensureAlpha()
      .png()
      .toBuffer(),
  ),
);
const directory = Buffer.alloc(6 + frames.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
for (const [index, frame] of frames.entries()) {
  const entry = 6 + index * 16;
  directory[entry] = sizes[index]!;
  directory[entry + 1] = sizes[index]!;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(frame.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += frame.length;
}
await writeFile(
  resolve(app, "favicon.ico"),
  Buffer.concat([directory, ...frames]),
);

const display = await readFile(
  resolve(
    website,
    "node_modules/@fontsource/secular-one/files/secular-one-latin-400-normal.woff2",
  ),
);
const body = await readFile(
  resolve(
    website,
    "node_modules/@fontsource/open-sans/files/open-sans-latin-400-normal.woff2",
  ),
);
const wave = await readFile(
  resolve(website, "public/assets/display/wave-static.svg"),
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(`<!doctype html><html lang="en"><head><style>
    @font-face{font-family:display;src:url(data:font/woff2;base64,${display.toString("base64")})}
    @font-face{font-family:body;src:url(data:font/woff2;base64,${body.toString("base64")})}
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#f2f2f2;color:#262626;font-family:body}
    main{padding:58px 80px;display:flex;align-items:center;justify-content:space-between;height:530px}
    h1{font:64px/1.15 display;margin:28px 0 16px}p{font-size:23px;line-height:1.5;max-width:570px;margin:0;color:#55555f}
    .brand{font:32px display;color:#276d8b}.squid{width:300px;height:300px;object-fit:contain}
    .wave{position:absolute;bottom:48px;width:1200px;height:70px}footer{position:absolute;bottom:0;background:#0c2641;color:#fff;width:100%;height:56px;padding:8px 80px;font:22px body}
    </style></head><body><main><section><div class="brand">InkByte</div><h1>A little link.<br>A lot to share.</h1><p>Long links made easy to share.<br>Your links, QR codes and click reports.</p></section><img class="squid" alt="" src="data:image/svg+xml;base64,${source.toString("base64")}"></main><img class="wave" alt="" src="data:image/svg+xml;base64,${wave.toString("base64")}"><footer>inkbyte.ca</footer></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(assets, "social-card.png") });
} finally {
  await browser.close();
}
console.log(
  "Generated original-artwork favicons, home-screen icons and social card.",
);
