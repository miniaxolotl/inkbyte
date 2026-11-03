# UI screenshots

Captured from a local production build, with synthetic public demo records.
These are not customer data or hosted-production screenshots. The original
squid artwork, typefaces and palette are retained, with a quieter responsive
layout and static footer wave.

| File                                       | Route/state                   |
| ------------------------------------------ | ----------------------------- |
| [Landing desktop](landing-desktop.png)     | `/`, 1440px                   |
| [Landing phone](landing-mobile.png)        | `/`, 390px                    |
| [Feature details](features-desktop.png)    | `/`, visible benefits section |
| [Help](help-desktop.png)                   | `/help`                       |
| [Privacy](privacy-desktop.png)             | `/privacy`                    |
| [Sign-in setup state](sign-in-desktop.png) | `/sign-in`, Clerk unavailable |
| [Missing page](not-found-desktop.png)      | `/visit/does-not-exist`       |
| [Bio page](bio-desktop.png)                | `/b/inkbyte-demo`             |
| [CTA interstitial](cta-desktop.png)        | `/demo-cta`                   |

```bash
SCREENSHOT_BASE_URL=http://localhost:3316 pnpm --filter @script/screenshots capture
```

The script waits for CSS and local fonts. Bio/CTA captures require the local
demo records or equivalent paths. Do not capture credentials, real profiles or
unrelated browser tabs. Account dashboard screenshots remain pending a real
Clerk test session; no authentication bypass is used for previews.
