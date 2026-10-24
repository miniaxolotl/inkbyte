# UI and interaction refinements

The visual foundation is the legacy InkByte design: original squid logo,
Secular One/Open Sans, cerulean controls, rose accents and navy wave artwork.
The refinement deliberately avoids a replacement SaaS template: navigation and
forms are lighter, headings retain the original character, advanced controls
are collapsed, and the wave is a static footer detail rather than a backdrop.

## Pages

- Landing: centered logo and shortener, domain/alias controls, optional CTA
  details, local history, copy feedback and clear account requirements.
- Accounts: consistent centered layouts, Clerk-themed controls, and an honest
  unavailable state when keys are missing.
- Dashboard: mobile-safe navigation/table, actual analytics, unavailable-data
  states, owned link editing, pausing, deletion confirmation and QR downloads.
- Link detail: preserved short URL/QR identity, daily clicks and CTA metrics.
- Bio editor: editable handle/description, publish state, handle-change warning,
  item creation/removal and a public-page preview.
- Public bio/CTA: intentionally quiet layouts focused on the destination.
- Help/privacy: native disclosure controls and explicit analytics preferences.
- Errors/loading: actionable retry states, semantic status announcements,
  keyboard focus and a skip link.

Native QR/privacy dialogs contain focus, support Escape and restore focus on
close. Touch targets are larger, labels remain readable, layouts are tested at
320px, and no private route is sent to Vercel website analytics. Short-link
HEAD/prefetch requests are not counted as clicks.

## Evidence and limits

See the [screenshot index](screenshots/README.md). Browser tests cover public
pages, narrow-phone layout, canonical/legacy redirects, bio domain retention,
CTA routing, history feedback and Vercel consent/privacy boundaries. Real
signed-in browser journeys remain gated by the dedicated Clerk secret key and
the owner's passkey verification. Source/API verification is not presented as
production authentication acceptance.
