# StylePort website

The independent product website for StylePort, a privacy-first UserCSS manager
for Safari.

This repository is intentionally separate from the StylePort application and
extension source. It contains the marketing site, privacy policy, support
documentation, product roadmap, and press kit.

## Website stack

The site is built with [Eleventy](https://www.11ty.dev/) and published by a
GitHub Actions workflow. Its source lives in `src/`, product images live in
`public/`, and the generated site is written to `dist/`.

The site is still in development. It is intentionally honest about the 1.0
release state and keeps downloads disabled until a Developer ID-signed,
Apple-notarized build is ready.

## Local development

```sh
npm install
npm run dev
```

## Production build

```sh
npm run build
```

Run `npm test` to build the site and verify every public route and required
asset.

Search metadata, social sharing assets, automated checks, and the post-deployment
indexing checklist are documented in [the SEO guide](docs/seo.md).

## Website analytics

The shared layout loads Tinylytics with `?events&beacon`, following its
[event documentation](https://tinylytics.app/docs/analytics/events). Content
pages count visits; the immediate `/updates/` redirect does not.

Link attributes record `app.testflight`, `support.checkout`, `contact.email`,
`file.download`, `link.outbound`, `cta.download`, and `cta.features`. Values are
fixed labels (button placement, destination name, or file name), not visitor
input. Checkout and TestFlight events measure clicks, not completed payments
or installations. Keep the website disclosure in `src/privacy.njk` in sync.

Tinylytics may reject localhost embeds. Stub the provider script during browser
checks to avoid sending preview traffic. Production collection must be verified
after publication. The app and extension do not use this website embed.

## GitHub Pages and styleport.app

Pushes to `main` build and deploy the site through `.github/workflows/pages.yml`.
The repository's Pages settings should use **GitHub Actions** as the source and
set the custom domain to `styleport.app`.

At Hover, the apex domain should point to GitHub Pages with these four `A`
records:

```text
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

The `www` host should be a `CNAME` to `kylereddoch.github.io`. Once DNS has
propagated and GitHub has issued its certificate, enable **Enforce HTTPS** in
the repository's Pages settings.

The generated site is public and indexable. GitHub Pages is static hosting and
does not provide the secure server-side password gate used by the earlier Sites
preview.

Public download links remain disabled until StylePort has a Developer ID-signed,
Apple-notarized release artifact. A signed update feed can be added alongside
the first public release.

The fail-closed website import and deployment process is documented in
[the direct-release guide](docs/direct-release.md). It requires explicit owner
approval, exact hashes, Sparkle signature verification, a release-notes file,
and a corresponding GPL source archive before any direct download can appear.

The website's development history and hosting decisions are recorded in
`docs/website-history.md`.
