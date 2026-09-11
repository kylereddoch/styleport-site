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

The website's development history and hosting decisions are recorded in
`docs/website-history.md`.
