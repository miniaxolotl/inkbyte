import "server-only";
import { site } from "./site";

/** Route-handler errors do not render through the Next.js metadata/layout tree. */
function errorDocument(unavailable: boolean) {
  const title = unavailable
    ? "Temporarily unavailable | InkByte"
    : "Link not found | InkByte";
  const description = unavailable
    ? "InkByte could not load this link right now. Wait a moment and try again."
    : "This short link does not exist. Check the address or ask the sender for a new InkByte link.";
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta name="description" content="${description}">
<meta name="theme-color" content="#f2f2f2">
<title>${title}</title>
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:image" content="${site.url}/assets/brand/social-card.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-icon.png">
<style>body{margin:0;background:#f2f2f2;color:#262626;font:16px/1.6 system-ui,sans-serif}main{max-width:26rem;min-height:90dvh;margin:auto;padding:2rem;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}h1{font-size:2rem;line-height:1.2}p{color:#55555f}a{display:block;margin-top:1rem;padding:.7rem 1.2rem;border-radius:.5rem;background:#276d8b;color:white;text-decoration:none}a:focus-visible{outline:3px solid #cc637f;outline-offset:4px}</style>
</head><body><main><img src="/assets/logo/default.svg" alt="InkByte" width="96" height="96"><h1>${unavailable ? "Give this link a moment." : "That link does not exist."}</h1><p>${description}</p>${unavailable ? '<a href="">Try again</a>' : ""}<a href="/">Back to InkByte</a></main></body></html>`;
}

export const shortLinkNotFoundHtml = errorDocument(false);
export const shortLinkUnavailableHtml = errorDocument(true);
