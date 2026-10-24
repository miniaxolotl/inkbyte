# Architecture

## Request flow

```
Browser
  │
  ├─ inkbyte.app/<slug>          → website /r/[slug]  → API /r/:slug  → destination
  │                                  (records the click, 302)
  │
  └─ inkbyte.app/dashboard        → website (Clerk session)
                                     → website /api/inkbyte/*  → API /api/v1/*
                                        (Clerk token as Bearer)
```

The website never exposes an API credential to the browser. It forwards the
Clerk session token to the API through a single allow-listed proxy route, and
the API applies every ownership rule.

## API routes

| Method   | Path                            | Auth  | Purpose                          |
| -------- | ------------------------------- | ----- | -------------------------------- |
| `GET`    | `/health/live`                  | —     | Process liveness                 |
| `GET`    | `/health/ready`                 | —     | Database reachable               |
| `GET`    | `/api/v1/domains`               | —     | Configured short domains         |
| `GET`    | `/api/v1/auth/session`          | token | Current account                  |
| `GET`    | `/api/v1/links`                 | token | Links owned by the caller        |
| `POST`   | `/api/v1/links`                 | token | Create a link                    |
| `GET`    | `/api/v1/links/:id`             | token | One owned link                   |
| `PATCH`  | `/api/v1/links/:id`             | token | Update an owned link             |
| `DELETE` | `/api/v1/links/:id`             | token | Soft-delete an owned link        |
| `GET`    | `/r/:slug`                      | —     | Redirect and record a click      |
| `GET`    | `/api/v1/analytics/overview`    | token | Account-wide analytics           |
| `GET`    | `/api/v1/analytics/links/:id`   | token | Analytics for one owned link     |

Every response uses the same envelope:

```json
{ "success": true, "data": { } }
```

```json
{ "success": false, "error": { "code": "not_found", "message": "…", "requestId": "…" } }
```

## Authentication

Clerk issues session tokens. The API verifies them against the instance JWKS,
using the `CLERK_ISSUER` value from configuration. The issuer is never derived
from a request, so a hostile `Host` header cannot redirect verification to an
attacker-controlled key set.

The subject (`user_…`) is the stable identifier. The API keeps a local
`users` row keyed by that subject so links can be owned, and refreshes the
display fields from the token claims or the Clerk directory on first sight.

## Data model

```
users ──< links >── domains
            │
            └──< link_events
```

| Table         | Purpose                                                  |
| ------------- | -------------------------------------------------------- |
| `users`       | One row per Clerk subject                                |
| `domains`     | Short domains a link can live on                         |
| `links`       | A short link, owned by a user, unique per domain and slug |
| `link_events` | One row per click, with a hashed visitor identifier      |

A link slug is unique per domain, not globally, so the same alias may exist on
two different domains.

Deleted links keep their row with `deleted_at` set. Link listings and
analytics ignore deleted rows, but the slug stays reserved.

## Click tracking

Each redirect records one `link_events` row when the link has tracking
enabled. The row stores a visitor identifier, the referrer, the user agent and
the country when the edge supplies it.

Unique visitors are counted as distinct visitor identifiers; total clicks are
the row count. The visitor identifier is supplied by the edge (`x-visitor-id`
or the forwarded address) and truncated to 256 characters. Raw IP addresses
are not stored.

## Environment

`lib/config` validates `process.env` with Zod at boot. Origins must be HTTPS
except on loopback, secrets must have the expected prefix, and numeric
settings are bounded. Empty environment variables are treated as absent so a
blank `CLERK_SECRET_KEY=` fails loudly instead of silently disabling auth.

## Monorepo conventions

- `lib/*` packages export TypeScript source; they are never built
  separately.
- Shared contracts live in `lib/shared` and are imported by both the API and
  the website.
- The API is bundled by esbuild; workspace packages are inlined and runtime
  dependencies stay external.
- Tests run through `node:test` via `tsx` against a disposable PostgreSQL
  database.
