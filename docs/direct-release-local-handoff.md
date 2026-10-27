# StylePort direct-release website handoff

Status date: October 27, 2026

## Completed locally

- Added a fail-closed importer at `tools/import-direct-release.mjs`.
- Added the release policy at `config/direct-release-policy.json`.
- Added the disabled-by-default presentation state at
  `src/_data/directRelease.json`; TestFlight remains the only visible download.
- Added staged Sparkle/direct-edition privacy wording to `src/privacy.njk` and
  accurate update guidance to `src/support.njk`.
- Added a conditional direct-download card with release notes, checksum, and
  corresponding GPL source links. It cannot render while `available` is false.
- Documented validation, import, deployment, and hosted-byte verification in
  `docs/direct-release.md`.
- Validation completed with `npm test` (20 tests passing), `git diff --check`,
  local browser review of the homepage, privacy policy, and support guidance,
  and Sparkle verification of the historical signed fixture.

No app source was edited. No release artifact was imported, pushed, published,
or installed.

## Known local inputs

- App repository: `/Users/gh0st/Developer/GitHub Repos/styleport`
- Build-2 direct archive:
  `.build/StylePort-direct-1.0.0-2.xcarchive`
- Build-2 store archive:
  `.build/StylePort-store-1.0.0-2.xcarchive`
- Old unapproved build-1 website candidate:
  `.build/direct-release-candidate/website/`

The old build-1 candidate is blocked by policy because it has the known
navigation defect. It was inspected only to confirm the current artifact and
appcast shape and was not copied into this repository.

## Remaining required inputs and gates

1. Notarize, export, package, and runtime-verify a new direct build 2 or later.
2. Produce final reviewed release notes and a complete corresponding GPL source
   archive with checksums.
3. Generate a signed appcast that references the immutable ZIP and canonical
   release-notes URL. Do not edit it after signing.
4. Create `release-approval.json` for those exact bytes only after Kyle gives
   explicit release approval.
5. Run `npm run release:validate`, then `npm run release:import`, `npm test`, and
   a local visual review.
6. Obtain separate approval to push/deploy.
7. Verify hosted hashes/signatures and complete an older-signed-build-to-new-
   build update test before calling direct updates ready.

The canonical feed remains absent locally and live until these gates pass. No
build-2 URL or signature has been invented.
