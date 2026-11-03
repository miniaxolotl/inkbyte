# Clerk production setup

Status: provisioned on the owner's existing InkByte application. Clerk reports
overall domain verification complete: DNS, email and both authentication and
hosted account-portal certificates are complete (2026-10-24).
This is identity-provider setup, not a website/API production rollout.

## Identity and routes

- Application: `app_3L9lKNz2Cu9t2wGOBtdoet1IyL6`.
- Production instance: `ins_3LA3ks5sniRZYkfCzm30Adc91Bv`.
- Website: `https://inkbyte.ca`.
- Fixed API token issuer: `https://clerk.inkbyte.ca`.
- Hosted account portal: `https://accounts.inkbyte.ca`.
- Embedded sign-in and sign-up paths: `/sign-in`, `/sign-up`.
- Home and sign-out destination: `/`.

The requested owner identity was verified before DNS writes. The production
instance was created only after the owner's explicit production-setup request;
the existing application and development instance were retained.

Verified email, the existing password protections and lockout policy are
preserved. Smart bot protection is enabled. Google sign-in is disabled until
dedicated production OAuth credentials are configured, rather than showing a
broken development-only connection. Product billing is disabled; no paid
provider upgrade was selected.

## DNS

These Clerk-supplied CNAMEs were added in the owner's Cloudflare account with
proxying **off** and automatic TTL. Existing apex, API and short-domain DNS was
not changed. All five records were read back and verified by Clerk.

| Name                         | Target                              |
| ---------------------------- | ----------------------------------- |
| `clerk.inkbyte.ca`           | `frontend-api.clerk.services`       |
| `accounts.inkbyte.ca`        | `accounts.clerk.services`           |
| `clkmail.inkbyte.ca`         | `mail.qkc4jvc8wacr.clerk.services`  |
| `clk._domainkey.inkbyte.ca`  | `dkim1.qkc4jvc8wacr.clerk.services` |
| `clk2._domainkey.inkbyte.ca` | `dkim2.qkc4jvc8wacr.clerk.services` |

Use Clerk's domain-status check before rollout: DNS, SSL and mail should all be
complete. The public `https://clerk.inkbyte.ca/.well-known/jwks.json` endpoint
returns signing keys over verified HTTPS. Certificate verification was not
disabled to obtain that result.

A command-line request to the hosted account portal returns Cloudflare's HTTP
403 browser challenge (`cf-mitigated: challenge`), not a certificate failure.
That protection was left intact. Provider verification is not a completed
browser sign-in journey; perform real account acceptance after stack rollout.

## Credential delivery

Production keys were retrieved through the authenticated official Clerk CLI;
their values are never stored in source or this document.

- Doppler `inkbyte/prd`: matching API/website publishable keys, server secret and
  the fixed issuer. Values were read back without displaying them.
- Doppler `inkbyte/prd_web`: both website key references added together; the
  server secret remains masked. Database/tracking/infrastructure keys remain
  excluded. Vercel production received a sensitive server secret and the public
  publishable-key configuration through its existing sync.
- GitHub's production environment: `CLERK_SECRET_KEY` and
  `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, preserving other environment settings.
- Existing ignored mode-0600 operator inventories retain private copies in the
  worktree and main checkout.

Production keys are for the production domain, never localhost or arbitrary
preview URLs. Development/preview website configs stay public-only until their
own complete development-key pairs are deliberately configured. No real account
or authentication bypass was added to the browser test suite.

## Rollout limits

Deploy the reviewed source only through the protected release path, with the
matching API configuration. Complete and accept a real sign-up/sign-in journey
on the production website after rollout. Persistent deployment credentials,
DigitalOcean provisioning, a least-privilege Neon runtime role and isolated
staging remain separate requirements; configuring Clerk does not deploy them.
