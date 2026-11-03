# Architecture

InkByte follows the Grove/Burrow monorepo structure: source-exported `lib/*`
workspaces, `packages/api`, `packages/website`, `scripts/*`, and `tests`.
The API uses Hono, Knex, Objection and PostgreSQL; the web uses Next.js App
Router, React and Tailwind. Clerk is the identity provider.

## Short links

```text
inkb.ca/<slug>  (also /r/<slug> and legacy /l/<slug>)
  → website route handler
  → API /r/:slug?format=json (validate domain, record eligible event)
  → copy signed visitor cookie onto the short domain
  → 302 to the HTTP(S) destination
    or 303 to /visit/<slug> for a CTA interstitial
      → Continue → website /r/<slug>?e=cta_click → API → 302 destination
```

The browser stays on the short domain until the final redirect. This keeps
visitor cookies first-party. Metadata reads and framework prefetches do not
count as clicks. CTA rendering itself does not add a second impression.
The same resolver handles QR and bio-item destinations. Routing accepts only
configured domains; localhost may use the default domain during development.

## Ownership and data

```text
users (Clerk subject) ──< links >── domains
                           └──< link_events
users ── bio_pages ──< bio_items >── links
```

Every account-owned API operation resolves the verified Clerk subject and
filters by its local user ID. Public endpoints reveal only published bio pages
and active short-link destinations. Soft-deleted link aliases remain reserved.
Update/pause/delete does not change the short URL or QR code.

The website BFF allow-lists paths, checks mutation origins, limits bodies,
uses timeouts, and injects the Clerk token server-side. The API independently
enforces authorization. Database objects are bound to an explicit Knex
connection, not a global model connection.

## Tracking

- Each eligible navigation records a `view`; CTA continuation records a
  separate `cta_click`, never a second view.
- Visitor IDs are random browser identifiers in HMAC-signed, HttpOnly,
  SameSite=Lax cookies. HTTPS responses add Secure. `TRACKING_SECRET` must
  stay stable across deployments and replicas.
- IP addresses are not persisted or fingerprinted. A visitor who refuses or
  clears cookies appears as new; these are approximate browsers, not people.
- Known bots, preview fetchers, empty user agents and prefetch requests are
  excluded. Bot detection is heuristic, not fraud prevention.
- Referrers retain only the origin. Organic clicks match known search-engine
  origins, not direct visits. Device classes are inferred from user agents.
- Country/city/region depend on headers supplied by a trusted hosting edge.
  Do not interpret missing geo as a user location. Do not treat publicly
  supplied geo headers as verified identity or security evidence.
- In-memory rate limits are per API instance, not a distributed guarantee.
- Analytics expose totals, distinct browsers, organic referrals, time windows,
  daily UTC counts, locations, devices, and CTA impressions/clicks. CTA metrics
  describe recorded events; they are not proof of a purchase or other action.

## Main API surfaces

| Surface    | Routes                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Health     | `GET /health/live`, `GET /health/ready`                                               |
| Account    | `GET /api/v1/auth/session`                                                            |
| Domains    | `GET /api/v1/domains`                                                                 |
| Links      | `GET/POST /api/v1/links`, `GET/PATCH/DELETE /api/v1/links/:id`                        |
| Redirect   | `GET /r/:slug?domain=…` (302 or JSON for the website)                                 |
| Metadata   | `GET /api/v1/public/links/:slug?domain=…`                                             |
| QR         | `GET /api/v1/qr?slug=…&domain=…&size=512`                                             |
| Bio        | `GET/PUT /api/v1/bio`, `POST /api/v1/bio/items`, `PATCH/DELETE /api/v1/bio/items/:id` |
| Public bio | `GET /api/v1/public/bio/:handle`                                                      |
| Analytics  | `GET /api/v1/analytics/overview`, `GET /api/v1/analytics/links/:id`                   |

JSON responses use `{ success: true, data }` or
`{ success: false, error: { code, message, requestId } }`. DELETE returns 204.
QR responses are SVG. Driver errors and credentials never reach response bodies.
