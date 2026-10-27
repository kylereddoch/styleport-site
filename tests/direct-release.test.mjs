import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  importCandidate,
  sha256,
  validateCandidate,
} from "../tools/import-direct-release.mjs";

const policy = JSON.parse(await readFile(
  new URL("../config/direct-release-policy.json", import.meta.url), "utf8"));

async function temporaryDirectory(prefix) {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

function embeddedInfo(version, build) {
  return {
    CFBundleIdentifier: policy.bundleIdentifier,
    CFBundleShortVersionString: version,
    CFBundleVersion: build,
    SUFeedURL: policy.feedUrl,
    SUPublicEDKey: policy.publicEdKey,
    SURequireSignedFeed: true,
    SUEnableSystemProfiling: false,
    SUAutomaticallyUpdate: false,
  };
}

async function candidateFixture({ approved = true, version = "1.0.0", build = "2" } = {}) {
  const root = await temporaryDirectory("styleport-candidate-");
  const archive = `StylePort-${version}-${build}.zip`;
  const checksum = `${archive}.sha256`;
  const releaseNotes = `release-notes-${version}-${build}.html`;
  const sourceArchive = `StylePort-${version}-${build}-source.tar.gz`;
  const sourceChecksum = `${sourceArchive}.sha256`;
  const archiveBytes = Buffer.from(`synthetic approved archive ${version}-${build}`);
  const notesBytes = Buffer.from(`<h1>StylePort ${version}</h1>\n`);
  const sourceBytes = Buffer.from(`synthetic corresponding GPL source ${version}-${build}`);
  const archiveHash = sha256(archiveBytes);
  const sourceHash = sha256(sourceBytes);
  const appcastBytes = Buffer.from(`<?xml version="1.0" standalone="yes"?><!-- sparkle-sign-warning:
signed fixture
--><rss xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle" version="2.0"><channel><title>StylePort</title><item><title>${version}</title><sparkle:version>${build}</sparkle:version><sparkle:shortVersionString>${version}</sparkle:shortVersionString><sparkle:minimumSystemVersion>${policy.minimumSystemVersion}</sparkle:minimumSystemVersion><sparkle:releaseNotesLink>${policy.releaseNotesBaseUrl}${releaseNotes}</sparkle:releaseNotesLink><enclosure url="${policy.downloadBaseUrl}${archive}" length="${archiveBytes.length}" type="application/octet-stream" sparkle:edSignature="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="></enclosure></item></channel></rss><!-- sparkle-signatures:
edSignature: BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB==
length: 1
-->`);
  const approval = {
    schemaVersion: 1,
    approved,
    approvedBy: approved ? policy.approvalAuthority : "",
    approvedAt: approved ? "2026-10-27T12:00:00-05:00" : "",
    version,
    build,
    appcast: "appcast.xml",
    appcastSha256: sha256(appcastBytes),
    archive,
    archiveSha256: archiveHash,
    checksum,
    releaseNotes,
    releaseNotesSha256: sha256(notesBytes),
    sourceArchive,
    sourceSha256: sourceHash,
    sourceChecksum,
  };
  await Promise.all([
    writeFile(path.join(root, approval.appcast), appcastBytes),
    writeFile(path.join(root, archive), archiveBytes),
    writeFile(path.join(root, checksum), `${archiveHash}  ${archive}\n`),
    writeFile(path.join(root, releaseNotes), notesBytes),
    writeFile(path.join(root, sourceArchive), sourceBytes),
    writeFile(path.join(root, sourceChecksum), `${sourceHash}  ${sourceArchive}\n`),
    writeFile(path.join(root, "release-approval.json"), `${JSON.stringify(approval, null, 2)}\n`),
  ]);
  return {
    root,
    approval,
    approvalPath: path.join(root, "release-approval.json"),
    appcastBytes,
    archiveBytes,
    notesBytes,
    sourceBytes,
  };
}

test("refuses a candidate without explicit owner approval", async () => {
  const siteRoot = await temporaryDirectory("styleport-site-");
  const fixture = await candidateFixture({ approved: false });
  try {
    await assert.rejects(validateCandidate({
      candidate: fixture.root,
      approvalPath: fixture.approvalPath,
      siteRoot,
      policy,
      archiveInspector: () => embeddedInfo("1.0.0", "2"),
      sourceInspector: () => {},
      signatureVerifier: () => {},
    }), /Release is not approved/);
  } finally {
    await Promise.all([rm(siteRoot, { recursive: true }), rm(fixture.root, { recursive: true })]);
  }
});

test("refuses a candidate when its approval record is missing", async () => {
  const siteRoot = await temporaryDirectory("styleport-site-");
  const candidate = await temporaryDirectory("styleport-candidate-");
  try {
    await assert.rejects(validateCandidate({
      candidate,
      approvalPath: path.join(candidate, "release-approval.json"),
      siteRoot,
      policy,
      archiveInspector: () => embeddedInfo("1.0.0", "2"),
      sourceInspector: () => {},
      signatureVerifier: () => {},
    }), /Approval JSON does not exist/);
  } finally {
    await Promise.all([rm(siteRoot, { recursive: true }), rm(candidate, { recursive: true })]);
  }
});

test("permanently blocks the known defective build 1 candidate", async () => {
  const siteRoot = await temporaryDirectory("styleport-site-");
  const fixture = await candidateFixture({ build: "1" });
  try {
    await assert.rejects(validateCandidate({
      candidate: fixture.root,
      approvalPath: fixture.approvalPath,
      siteRoot,
      policy,
      archiveInspector: () => embeddedInfo("1.0.0", "1"),
      sourceInspector: () => {},
      signatureVerifier: () => {},
    }), /below the minimum publishable build 2|known navigation defect/);
  } finally {
    await Promise.all([rm(siteRoot, { recursive: true }), rm(fixture.root, { recursive: true })]);
  }
});

test("refuses changed archive bytes even when approval metadata still exists", async () => {
  const siteRoot = await temporaryDirectory("styleport-site-");
  const fixture = await candidateFixture();
  try {
    await writeFile(path.join(fixture.root, fixture.approval.archive), "tampered archive");
    await assert.rejects(validateCandidate({
      candidate: fixture.root,
      approvalPath: fixture.approvalPath,
      siteRoot,
      policy,
      archiveInspector: () => embeddedInfo("1.0.0", "2"),
      sourceInspector: () => {},
      signatureVerifier: () => {},
    }), /Release archive hash does not match approval/);
  } finally {
    await Promise.all([rm(siteRoot, { recursive: true }), rm(fixture.root, { recursive: true })]);
  }
});

test("imports approved bytes unchanged and activates matching release metadata", async () => {
  const siteRoot = await temporaryDirectory("styleport-site-");
  const fixture = await candidateFixture();
  const signatureChecks = [];
  try {
    await mkdir(path.join(siteRoot, "src/_data"), { recursive: true });
    await importCandidate({
      candidate: fixture.root,
      approvalPath: fixture.approvalPath,
      siteRoot,
      policy,
      archiveInspector: () => embeddedInfo("1.0.0", "2"),
      sourceInspector: () => {},
      signatureVerifier: details => signatureChecks.push(details),
    });

    assert.equal(signatureChecks.length, 1);
    assert.equal(signatureChecks[0].archiveSignature,
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==");
    assert.deepEqual(await readFile(path.join(siteRoot, "public/updates/appcast.xml")),
      fixture.appcastBytes);
    assert.deepEqual(await readFile(path.join(siteRoot, "public/downloads", fixture.approval.archive)),
      fixture.archiveBytes);
    assert.deepEqual(await readFile(path.join(siteRoot, "public/updates", fixture.approval.releaseNotes)),
      fixture.notesBytes);
    assert.deepEqual(await readFile(path.join(siteRoot, "public/downloads", fixture.approval.sourceArchive)),
      fixture.sourceBytes);

    const release = JSON.parse(await readFile(
      path.join(siteRoot, "src/_data/directRelease.json"), "utf8"));
    assert.deepEqual(release, {
      available: true,
      version: "1.0.0",
      build: "2",
      minimumSystemVersion: "14.0",
      archivePath: "/downloads/StylePort-1.0.0-2.zip",
      archiveSha256: fixture.approval.archiveSha256,
      checksumPath: "/downloads/StylePort-1.0.0-2.zip.sha256",
      releaseNotesPath: "/updates/release-notes-1.0.0-2.html",
      sourcePath: "/downloads/StylePort-1.0.0-2-source.tar.gz",
      sourceSha256: fixture.approval.sourceSha256,
      sourceChecksumPath: "/downloads/StylePort-1.0.0-2-source.tar.gz.sha256",
    });
  } finally {
    await Promise.all([rm(siteRoot, { recursive: true }), rm(fixture.root, { recursive: true })]);
  }
});

test("keeps direct artifacts gated by the site release switch", async () => {
  const release = JSON.parse(await readFile(
    new URL("../src/_data/directRelease.json", import.meta.url), "utf8"));
  if (release.available) {
    await Promise.all([
      readFile(new URL("../public/updates/appcast.xml", import.meta.url)),
      readFile(new URL(`../public${release.archivePath}`, import.meta.url)),
      readFile(new URL(`../public${release.sourcePath}`, import.meta.url)),
      readFile(new URL(`../public${release.releaseNotesPath}`, import.meta.url)),
    ]);
  } else {
    assert.deepEqual(release, { available: false });
    await assert.rejects(readFile(new URL("../public/updates/appcast.xml", import.meta.url)),
      error => error.code === "ENOENT");
    await assert.rejects(readFile(new URL("../dist/updates/appcast.xml", import.meta.url)),
      error => error.code === "ENOENT");
  }
});
