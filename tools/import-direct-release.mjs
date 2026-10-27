import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  constants,
  copyFile,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = fileURLToPath(new URL("../", import.meta.url));
const POLICY_PATH = new URL("../config/direct-release-policy.json", import.meta.url);
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const VERSION_PATTERN = /^\d+(?:\.\d+)*$/;
const SAFE_FILE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function fail(message) {
  throw new Error(message);
}

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function json(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function requireValue(condition, message) {
  if (!condition) fail(message);
}

function safeFilename(value, field) {
  requireValue(typeof value === "string" && SAFE_FILE_PATTERN.test(value),
    `${field} must be one safe file name.`);
  requireValue(path.basename(value) === value, `${field} must not contain a path.`);
  return value;
}

function requireHash(value, field) {
  requireValue(typeof value === "string" && HASH_PATTERN.test(value),
    `${field} must be a lowercase SHA-256 digest.`);
}

function tagElement(body, name, label = name) {
  const matches = [...body.matchAll(
    new RegExp(`<${name}(?:\\s+([^>]*))?>([^<]+)</${name}>`, "g"))];
  requireValue(matches.length === 1, `Signed appcast must contain one ${label}.`);
  return {
    attributes: attributes(matches[0][1] || ""),
    value: matches[0][2].trim(),
  };
}

function tag(body, name, label = name) {
  const matches = [...body.matchAll(new RegExp(`<${name}>([^<]+)</${name}>`, "g"))];
  requireValue(matches.length === 1, `Signed appcast must contain one ${label}.`);
  return matches[0][1].trim();
}

function attributes(element) {
  const parsed = new Map();
  for (const match of element.matchAll(/([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*"([^"]*)"/g)) {
    requireValue(!parsed.has(match[1]), `Duplicate appcast attribute: ${match[1]}.`);
    parsed.set(match[1], match[2]);
  }
  return parsed;
}

export function validateAppcast(bytes, approval, policy) {
  const xml = bytes.toString("utf8");
  requireValue(xml.includes("<!-- sparkle-sign-warning:"),
    "Signed appcast is missing Sparkle's signing warning.");
  requireValue(xml.includes("<!-- sparkle-signatures:"),
    "Signed appcast is missing its embedded feed signature.");

  const items = [...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/g)].map(match => match[1]);
  requireValue(items.length > 0, "Signed appcast contains no release items.");
  const item = items.find(body =>
    tag(body, "sparkle:shortVersionString") === approval.version
      && tag(body, "sparkle:version") === approval.build);
  requireValue(item, `Signed appcast has no ${approval.version} (${approval.build}) item.`);

  const enclosureMatches = [...item.matchAll(/<enclosure\s+([^>]+?)(?:\s*\/?>|><\/enclosure>)/g)];
  requireValue(enclosureMatches.length === 1,
    "Release item must contain exactly one enclosure.");
  const enclosure = attributes(enclosureMatches[0][1]);
  const releaseNotesElement = tagElement(item,
    "sparkle:releaseNotesLink", "release-notes link");
  const releaseNotes = releaseNotesElement.value;
  const releaseNotesAttributes = releaseNotesElement.attributes;
  const expectedArchiveUrl = `${policy.downloadBaseUrl}${approval.archive}`;
  const expectedNotesUrl = `${policy.releaseNotesBaseUrl}${approval.releaseNotes}`;

  requireValue(enclosure.get("url") === expectedArchiveUrl,
    `Appcast archive URL must be ${expectedArchiveUrl}.`);
  requireValue(enclosure.get("type") === "application/octet-stream",
    "Appcast enclosure must use application/octet-stream.");
  requireValue(/^\d+$/.test(enclosure.get("length") || ""),
    "Appcast enclosure length is missing or invalid.");
  requireValue(typeof enclosure.get("sparkle:edSignature") === "string"
      && enclosure.get("sparkle:edSignature").length > 40,
    "Appcast enclosure is missing its Ed25519 signature.");
  requireValue(releaseNotes === expectedNotesUrl,
    `Appcast release-notes URL must be ${expectedNotesUrl}.`);
  requireValue(/^\d+$/.test(releaseNotesAttributes.get("sparkle:length") || ""),
    "Appcast release-notes length is missing or invalid.");
  requireValue(typeof releaseNotesAttributes.get("sparkle:edSignature") === "string"
      && releaseNotesAttributes.get("sparkle:edSignature").length > 40,
    "Appcast release notes are missing their Ed25519 signature.");
  requireValue(tag(item, "sparkle:minimumSystemVersion") === policy.minimumSystemVersion,
    `Appcast minimum system version must be ${policy.minimumSystemVersion}.`);

  return {
    xml,
    archiveUrl: expectedArchiveUrl,
    archiveLength: Number(enclosure.get("length")),
    archiveSignature: enclosure.get("sparkle:edSignature"),
    releaseNotesUrl: expectedNotesUrl,
    releaseNotesLength: Number(releaseNotesAttributes.get("sparkle:length")),
    releaseNotesSignature: releaseNotesAttributes.get("sparkle:edSignature"),
    enclosureUrls: [...xml.matchAll(/<enclosure\s+[^>]*url="([^"]+)"[^>]*>/g)]
      .map(match => match[1]),
  };
}

export function releaseArchiveEntryIsAllowed(entry) {
  if (entry === "StylePort.app" || entry.startsWith("StylePort.app/")) return true;
  if (entry === "__MACOSX/") return true;
  if (!entry.startsWith("__MACOSX/")) return false;
  const relative = entry.slice("__MACOSX/".length);
  if (!(relative === "StylePort.app/" || relative.startsWith("StylePort.app/"))) return false;
  return entry.endsWith("/") || path.basename(relative).startsWith("._");
}

function inspectArchive(archive) {
  const entries = execFileSync("unzip", ["-Z1", archive], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  }).trim().split(/\r?\n/).filter(Boolean);
  requireValue(entries.length > 0, "Release ZIP is empty.");
  for (const entry of entries) {
    const segments = entry.split("/");
    requireValue(!entry.startsWith("/") && !segments.includes(".."),
      `Release ZIP contains an unsafe path: ${entry}.`);
    requireValue(releaseArchiveEntryIsAllowed(entry),
      `Release ZIP contains an unexpected top-level path: ${entry}.`);
  }
  requireValue(entries.includes("StylePort.app/Contents/Info.plist"),
    "Release ZIP is missing StylePort.app/Contents/Info.plist.");

  const plist = execFileSync("unzip", ["-p", archive, "StylePort.app/Contents/Info.plist"], {
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", "--", "-"], {
    input: plist,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  }));
}

function inspectSourceArchive(sourceArchive) {
  const entries = execFileSync("tar", ["-tzf", sourceArchive], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  }).trim().split(/\r?\n/).filter(Boolean);
  requireValue(entries.length > 0, "GPL source archive is empty.");
  for (const entry of entries) {
    const segments = entry.split("/");
    requireValue(!entry.startsWith("/") && !segments.includes(".."),
      `GPL source archive contains an unsafe path: ${entry}.`);
  }
  requireValue(entries.some(entry => /(^|\/)(COPYING|LICENSE)(\.[A-Za-z0-9-]+)?$/.test(entry)),
    "GPL source archive must include its license file.");
  requireValue(entries.some(entry => /(^|\/)src\//.test(entry)),
    "GPL source archive must include the application source tree.");
  requireValue(entries.some(entry => /(^|\/)package\.json$/.test(entry)),
    "GPL source archive must include package.json for the distributed source.");
}

function verifyEmbeddedSettings(info, approval, policy) {
  requireValue(info.CFBundleIdentifier === policy.bundleIdentifier,
    `Bundle identifier must be ${policy.bundleIdentifier}.`);
  requireValue(info.CFBundleShortVersionString === approval.version,
    "Archive marketing version does not match approval.");
  requireValue(String(info.CFBundleVersion) === approval.build,
    "Archive build number does not match approval.");
  requireValue(info.SUFeedURL === policy.feedUrl,
    `Archive update feed must be ${policy.feedUrl}.`);
  requireValue(info.SUPublicEDKey === policy.publicEdKey,
    "Archive Sparkle public key does not match website release policy.");
  requireValue(info.SURequireSignedFeed === true,
    "Archive must require a signed Sparkle feed.");
  requireValue(info.SUEnableSystemProfiling === false,
    "Archive must disable Sparkle system profiling.");
  requireValue(info.SUAutomaticallyUpdate === false,
    "Archive must disable automatic installation.");
  requireValue(info.SUEnableAutomaticChecks !== true,
    "Archive must not enable automatic checks before the user opts in.");
}

function defaultSignatureVerifier({
  appcast,
  archive,
  archiveSignature,
  releaseNotes,
  releaseNotesSignature,
  sparkleBin,
}) {
  const signer = path.join(sparkleBin, "sign_update");
  execFileSync(signer, ["--account", "dev.relaybyte.styleport", "--verify", appcast], {
    stdio: "inherit",
  });
  execFileSync(signer,
    ["--account", "dev.relaybyte.styleport", "--verify", archive, archiveSignature],
    { stdio: "inherit" });
  execFileSync(signer,
    ["--account", "dev.relaybyte.styleport", "--verify", releaseNotes, releaseNotesSignature],
    { stdio: "inherit" });
}

function exactChecksum(hash, filename) {
  return `${hash}  ${filename}\n`;
}

async function regularFile(file, label) {
  const info = await lstat(file);
  requireValue(info.isFile() && !info.isSymbolicLink(), `${label} must be a regular file.`);
}

async function requiredRealpath(file, label) {
  try {
    return await realpath(file);
  } catch (error) {
    if (error.code === "ENOENT") fail(`${label} does not exist: ${file}.`);
    throw error;
  }
}

async function candidateFile(candidate, filename, label) {
  const file = path.join(candidate, safeFilename(filename, label));
  await regularFile(file, label);
  return file;
}

async function preserveExistingFeed(siteRoot, newAppcast) {
  const existingPath = path.join(siteRoot, "public/updates/appcast.xml");
  let existing;
  try {
    existing = await readFile(existingPath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  const oldUrls = [...existing.matchAll(/<enclosure\s+[^>]*url="([^"]+)"[^>]*>/g)]
    .map(match => match[1]);
  for (const url of oldUrls) {
    requireValue(newAppcast.enclosureUrls.includes(url),
      `New signed feed drops the existing immutable release ${url}.`);
  }
}

export async function validateCandidate({
  candidate,
  approvalPath,
  siteRoot = SITE_ROOT,
  policy: suppliedPolicy,
  signatureVerifier = defaultSignatureVerifier,
  archiveInspector = inspectArchive,
  sourceInspector = inspectSourceArchive,
  sparkleBin = process.env.SPARKLE_BIN
    || path.resolve(SITE_ROOT, "../styleport/.build/sparkle-tools/bin"),
}) {
  requireValue(candidate, "Pass --candidate with the packaged website artifact directory.");
  requireValue(approvalPath, "Pass --approval with the explicit release approval JSON.");
  const candidateRoot = await requiredRealpath(candidate, "Candidate directory");
  const candidateInfo = await lstat(candidateRoot);
  requireValue(candidateInfo.isDirectory(), "Candidate path must be a directory.");
  const approvalFile = await requiredRealpath(approvalPath, "Approval JSON");
  await regularFile(approvalFile, "Approval JSON");
  const relativeApproval = path.relative(candidateRoot, approvalFile);
  requireValue(relativeApproval && !relativeApproval.startsWith("..") && !path.isAbsolute(relativeApproval),
    "Approval JSON must be stored inside the candidate directory.");
  for (const unsafeRoot of ["public", "dist", ".git"].map(name => path.join(siteRoot, name))) {
    const relative = path.relative(unsafeRoot, candidateRoot);
    requireValue(relative.startsWith("..") || path.isAbsolute(relative),
      `Candidate directory must not be inside ${unsafeRoot}.`);
  }

  const policy = suppliedPolicy || await json(POLICY_PATH);
  const approval = await json(approvalFile);
  requireValue(approval.schemaVersion === policy.schemaVersion,
    "Approval schema does not match release policy.");
  requireValue(approval.approved === true,
    "Release is not approved. Refusing to stage or expose it.");
  requireValue(approval.approvedBy === policy.approvalAuthority,
    `Release must be explicitly approved by ${policy.approvalAuthority}.`);
  requireValue(typeof approval.approvedAt === "string"
      && !Number.isNaN(Date.parse(approval.approvedAt)),
    "Approval must include a valid approvedAt timestamp.");
  requireValue(VERSION_PATTERN.test(approval.version), "Approval version is invalid.");
  requireValue(VERSION_PATTERN.test(approval.build), "Approval build is invalid.");
  requireValue(BigInt(approval.build) >= BigInt(policy.minimumBuild),
    `Build ${approval.build} is below the minimum publishable build ${policy.minimumBuild}.`);
  const blocked = policy.blockedCandidates.find(item =>
    item.version === approval.version && item.build === approval.build);
  requireValue(!blocked, blocked
    ? `Candidate ${approval.version} (${approval.build}) is blocked: ${blocked.reason}`
    : "Candidate is blocked.");

  const expected = {
    appcast: "appcast.xml",
    archive: `StylePort-${approval.version}-${approval.build}.zip`,
    checksum: `StylePort-${approval.version}-${approval.build}.zip.sha256`,
    releaseNotes: `release-notes-${approval.version}-${approval.build}.html`,
    sourceArchive: `StylePort-${approval.version}-${approval.build}-source.tar.gz`,
    sourceChecksum: `StylePort-${approval.version}-${approval.build}-source.tar.gz.sha256`,
  };
  for (const [field, expectedName] of Object.entries(expected)) {
    requireValue(approval[field] === expectedName,
      `${field} must be named ${expectedName}.`);
  }
  for (const field of ["appcastSha256", "archiveSha256", "releaseNotesSha256", "sourceSha256"]) {
    requireHash(approval[field], field);
  }

  const files = {};
  for (const field of Object.keys(expected)) {
    files[field] = await candidateFile(candidateRoot, approval[field], field);
  }
  const bytes = {
    appcast: await readFile(files.appcast),
    archive: await readFile(files.archive),
    checksum: await readFile(files.checksum, "utf8"),
    releaseNotes: await readFile(files.releaseNotes),
    sourceArchive: await readFile(files.sourceArchive),
    sourceChecksum: await readFile(files.sourceChecksum, "utf8"),
  };
  requireValue(sha256(bytes.appcast) === approval.appcastSha256,
    "Signed appcast hash does not match approval.");
  requireValue(sha256(bytes.archive) === approval.archiveSha256,
    "Release archive hash does not match approval.");
  requireValue(bytes.checksum === exactChecksum(approval.archiveSha256, approval.archive),
    "Archive checksum file is not exact or does not match approval.");
  requireValue(sha256(bytes.releaseNotes) === approval.releaseNotesSha256,
    "Release notes hash does not match approval.");
  requireValue(sha256(bytes.sourceArchive) === approval.sourceSha256,
    "GPL source archive hash does not match approval.");
  requireValue(bytes.sourceChecksum === exactChecksum(approval.sourceSha256, approval.sourceArchive),
    "GPL source checksum file is not exact or does not match approval.");

  const appcast = validateAppcast(bytes.appcast, approval, policy);
  requireValue(appcast.archiveLength === bytes.archive.length,
    "Appcast enclosure length does not match the approved ZIP.");
  requireValue(appcast.releaseNotesLength === bytes.releaseNotes.length,
    "Appcast release-notes length does not match the approved HTML.");
  await preserveExistingFeed(siteRoot, appcast);
  verifyEmbeddedSettings(await archiveInspector(files.archive), approval, policy);
  await sourceInspector(files.sourceArchive);

  const protectedHashes = {
    appcast: sha256(bytes.appcast),
    archive: sha256(bytes.archive),
    releaseNotes: sha256(bytes.releaseNotes),
  };
  await signatureVerifier({
    appcast: files.appcast,
    archive: files.archive,
    archiveSignature: appcast.archiveSignature,
    releaseNotes: files.releaseNotes,
    releaseNotesSignature: appcast.releaseNotesSignature,
    sparkleBin,
  });
  requireValue(sha256(await readFile(files.appcast)) === protectedHashes.appcast,
    "Signature verification changed the signed appcast bytes.");
  requireValue(sha256(await readFile(files.archive)) === protectedHashes.archive,
    "Signature verification changed the release archive bytes.");
  requireValue(sha256(await readFile(files.releaseNotes)) === protectedHashes.releaseNotes,
    "Signature verification changed the release-notes bytes.");

  const metadata = {
    available: true,
    version: approval.version,
    build: approval.build,
    minimumSystemVersion: policy.minimumSystemVersion,
    archivePath: `/downloads/${approval.archive}`,
    archiveSha256: approval.archiveSha256,
    checksumPath: `/downloads/${approval.checksum}`,
    releaseNotesPath: `/updates/${approval.releaseNotes}`,
    sourcePath: `/downloads/${approval.sourceArchive}`,
    sourceSha256: approval.sourceSha256,
    sourceChecksumPath: `/downloads/${approval.sourceChecksum}`,
  };
  return { approval, appcast, bytes, candidateRoot, files, metadata, policy };
}

async function copyImmutable(source, destination, expectedHash) {
  await mkdir(path.dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    requireValue(sha256(existing) === expectedHash,
      `Refusing to overwrite immutable release file ${destination}.`);
    return;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  await copyFile(source, destination, constants.COPYFILE_EXCL);
  requireValue(sha256(await readFile(destination)) === expectedHash,
    `Copied release file failed verification: ${destination}.`);
}

async function replaceVerified(source, destination, expectedHash) {
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.next-${process.pid}-${randomUUID()}`;
  await copyFile(source, temporary, constants.COPYFILE_EXCL);
  requireValue(sha256(await readFile(temporary)) === expectedHash,
    `Staged file failed verification: ${destination}.`);
  await rename(temporary, destination);
}

export async function importCandidate(options) {
  const siteRoot = options.siteRoot || SITE_ROOT;
  const validated = await validateCandidate({ ...options, siteRoot });
  const staging = path.join(siteRoot, ".release-staging", randomUUID());
  await mkdir(staging, { recursive: true });
  try {
    const staged = {};
    for (const field of ["appcast", "archive", "checksum", "releaseNotes", "sourceArchive", "sourceChecksum"]) {
      staged[field] = path.join(staging, validated.approval[field]);
      await copyFile(validated.files[field], staged[field], constants.COPYFILE_EXCL);
    }
    const metadataFile = path.join(staging, "directRelease.json");
    const metadataBytes = Buffer.from(`${JSON.stringify(validated.metadata, null, 2)}\n`);
    await writeFile(metadataFile, metadataBytes, { flag: "wx" });

    await copyImmutable(staged.archive,
      path.join(siteRoot, "public/downloads", validated.approval.archive),
      validated.approval.archiveSha256);
    await copyImmutable(staged.checksum,
      path.join(siteRoot, "public/downloads", validated.approval.checksum),
      sha256(validated.bytes.checksum));
    await copyImmutable(staged.releaseNotes,
      path.join(siteRoot, "public/updates", validated.approval.releaseNotes),
      validated.approval.releaseNotesSha256);
    await copyImmutable(staged.sourceArchive,
      path.join(siteRoot, "public/downloads", validated.approval.sourceArchive),
      validated.approval.sourceSha256);
    await copyImmutable(staged.sourceChecksum,
      path.join(siteRoot, "public/downloads", validated.approval.sourceChecksum),
      sha256(validated.bytes.sourceChecksum));

    // The signed feed is the activation switch and is copied byte-for-byte last.
    await replaceVerified(staged.appcast,
      path.join(siteRoot, "public/updates/appcast.xml"),
      validated.approval.appcastSha256);
    await replaceVerified(metadataFile,
      path.join(siteRoot, "src/_data/directRelease.json"),
      sha256(metadataBytes));
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return validated;
}

function parseArguments(argv) {
  const options = { validateOnly: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--validate-only") options.validateOnly = true;
    else if (argument === "--candidate") options.candidate = argv[++index];
    else if (argument === "--approval") options.approvalPath = argv[++index];
    else if (argument === "--sparkle-bin") options.sparkleBin = argv[++index];
    else fail(`Unknown argument: ${argument}`);
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const result = options.validateOnly
    ? await validateCandidate(options)
    : await importCandidate(options);
  const verb = options.validateOnly ? "Validated" : "Imported";
  console.log(`${verb} StylePort ${result.approval.version} (${result.approval.build}).`);
  if (!options.validateOnly) {
    console.log("Run npm test, inspect the local preview, and obtain separate approval before pushing.");
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Direct release refused: ${error.message}`);
    process.exitCode = 1;
  });
}
