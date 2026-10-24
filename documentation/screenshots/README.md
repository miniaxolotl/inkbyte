# Website screenshots

Captured with `pnpm --filter @script/screenshots capture` against a production
build of the website. The script waits for stylesheets and fonts to settle so
the captures reflect the rendered page, not a pre-paint frame.

| File                 | Route             | Viewport        |
| -------------------- | ----------------- | --------------- |
| `landing-desktop.png`| `/`               | 1440 × 900 @2x  |
| `landing-mobile.png` | `/`               | 390 × 844 @2x   |
| `sign-in-desktop.png`| `/sign-in`        | 1440 × 900 @2x  |
| `not-found-desktop.png` | `/does-not-exist` | 1440 × 900 @2x |

The dashboard requires a signed-in Clerk account, so it is not captured by the
script. Use the documentation preview in the pull request for the current
signed-out surfaces; add signed-in captures here once a staging Clerk
instance with a demo account is available.
