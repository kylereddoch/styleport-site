# StylePort website history

This repository is the independent marketing and documentation site for
StylePort. It deliberately remains separate from the Safari application and
extension source.

## July 2026: first product website

The first site established StylePort as a Safari-first, privacy-first UserCSS
manager. It introduced the product landing page, feature and import workflow,
free/open-source pricing, privacy policy, support and installation guide,
release page, and press kit. Development screenshots, the app icon, and a
bespoke Open Graph image were added at the same time.

The site described StylePort as a GPL-3.0-only downstream project based on the
mature Stylus engine, with upstream history and attribution retained. It also
made the product's privacy promises explicit: no analytics, advertising,
tracking, telemetry, or StylePort account.

## July 2026: private development preview

The original Vinext/Cloudflare Worker build was published through Sites at
`styleport-safari.cyberseckyle.chatgpt.site`. A server-side shared-password gate
protected every page while the project was reviewed. Secure, HttpOnly sessions
lasted seven days, and the preview was blocked from indexing with metadata,
headers, private caching, and `robots.txt`.

Public downloads stayed disabled while the app awaited Developer ID signing and
Apple notarization. A developer-managed signed update feed, likely using
Sparkle, remained a release-time decision.

## September 2026: Eleventy and GitHub Pages

The site was converted from Vinext to Eleventy so it could be maintained as a
small static website and deployed from its own GitHub repository. The full
marketing site, policies, support material, release status, press assets, visual
design, and original Git history were retained.

GitHub Pages cannot provide the secure server-side password gate used by the
earlier Worker. The Pages version is therefore public, clearly marked as a
development preview, and indexable at the owner's request. The planned primary
domain is `styleport.app`, registered through Hover.
