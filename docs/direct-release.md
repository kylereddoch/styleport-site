# Direct-release website workflow

The public TestFlight beta remains the only available StylePort download until
this workflow imports an explicitly approved direct-release candidate. The
website must not expose an archive merely because it compiled, notarized, or
was packaged successfully.

## Public paths

- Signed feed: `https://styleport.app/updates/appcast.xml`
- Immutable app ZIP and checksums: `https://styleport.app/downloads/`
- Immutable corresponding GPL source archive: `https://styleport.app/downloads/`
- Immutable release notes: `https://styleport.app/updates/`

`public/updates/appcast.xml` is copied byte-for-byte from Sparkle's signed
output. Do not format, template, minify, or edit it. Any change requires the app
release process to regenerate and re-sign the feed.

## Candidate contents

The app release process must create a new external candidate directory. For
version `1.0.0`, build `2`, it must contain:

```text
appcast.xml
StylePort-1.0.0-2.zip
StylePort-1.0.0-2.zip.sha256
release-notes-1.0.0-2.html
StylePort-1.0.0-2-source.tar.gz
StylePort-1.0.0-2-source.tar.gz.sha256
release-approval.json
```

The signed appcast must include the exact archive URL, archive byte length,
Ed25519 enclosure signature, macOS 14.0 minimum, and the canonical release
notes URL. The source archive must contain the complete corresponding source
and retained GPL/upstream notices for the distributed binary.

Copy `examples/direct-release-approval.json` into the candidate directory only
after all files are final. Fill in the exact hashes. Set `approved` to `true`,
`approvedBy` to `Kyle Reddoch`, and `approvedAt` to the explicit approval time
only after Kyle approves those exact bytes. Approval of a build, notarization,
or local runtime test is not website publication approval.

## Validate without staging

```sh
npm run release:validate -- \
  --candidate /absolute/path/to/candidate/website \
  --approval /absolute/path/to/candidate/website/release-approval.json
```

The validator refuses missing or unapproved candidates, unsafe paths, changed
hashes, mismatched version/build values, a missing GPL source archive, a feed
without release notes, build 1, and updater settings that weaken signed-feed or
privacy guarantees. It also checks that the source archive contains a license,
`package.json`, and the source tree. It calls Sparkle 2.10.0's `sign_update` to verify both the
embedded feed signature and the archive's Ed25519 enclosure signature. Pass a
different official tools directory with `--sparkle-bin` when needed.

## Import locally

```sh
npm run release:import -- \
  --candidate /absolute/path/to/candidate/website \
  --approval /absolute/path/to/candidate/website/release-approval.json
npm test
npm run dev
```

The importer preserves immutable archives, refuses conflicting destinations,
and activates the release by copying the already-signed appcast byte-for-byte
last. It writes `src/_data/directRelease.json`, which makes the direct-download,
release-notes, checksum, and corresponding-source links appear. Review the
local site and Git diff. Do not push until Kyle separately approves publication.

For later releases, keep all existing ZIPs and source archives. Generate the
new signed feed from a directory containing the retained releases. The importer
refuses a new feed that drops an existing enclosure URL.

## Deployment and post-deployment checks

After explicit publication approval, commit the imported files and push through
the existing GitHub Pages workflow. Wait for the workflow to succeed, then:

1. Download the live appcast and compare its SHA-256 with the approved appcast.
2. Download every newly linked ZIP, checksum, source archive, and release-notes
   file and compare each with its approved local hash.
3. Run Sparkle's verifier against the live feed and archive.
4. Confirm the homepage links the exact approved version/build and still offers
   the public TestFlight beta as a separate Apple-distributed edition.
5. From an older signed direct build, test the complete prompted update with
   Safari enabled and styles backed up. Deployment success alone does not prove
   the update works.

If any hosted byte differs, remove the download link/feed through a reviewed
revert and investigate. Never repair a signed feed in place.
