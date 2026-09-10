import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function output(pathname) {
  return readFile(new URL(`../dist/${pathname}`, import.meta.url), "utf8");
}

test("builds the StylePort product page", async () => {
  const html = await output("index.html");
  assert.match(html, /<title>StylePort — UserCSS for Safari<\/title>/i);
  assert.match(html, /The web,/);
  assert.match(html, /wearing your colors/);
  assert.match(html, /Free means the whole app/);
  assert.match(html, /Coming soon/);
  assert.match(html, /Development preview/);
  assert.match(html, /content="index, follow"/);
  assert.match(html, /id="appearance"/);
  assert.match(html, /RelayByte/);
  assert.match(html, /rel="icon" href="\/styleport-icon\.png"/);
  assert.doesNotMatch(html, />Source code</);
  assert.doesNotMatch(html, /Enter the shared password|noindex/i);
});

test("builds every public information route", async () => {
  const routes = [
    ["privacy/index.html", /Your styles stay yours/],
    ["support/index.html", /Start with the simple answer/],
    ["press/index.html", /Everything needed to cover StylePort/],
    ["updates/index.html", /What’s shipping next/],
  ];
  for (const [pathname, expected] of routes) {
    const html = await output(pathname);
    assert.match(html, expected, pathname);
    if (pathname === "privacy/index.html") assert.match(html, /styleport-appearance/);
  }
});

test("ships product assets and GitHub Pages metadata", async () => {
  await Promise.all([
    access(new URL("../dist/styleport-icon.png", import.meta.url)),
    access(new URL("../dist/og.png", import.meta.url)),
    access(new URL("../dist/press/import-style.png", import.meta.url)),
    access(new URL("../dist/assets/theme.js", import.meta.url)),
    access(new URL("../dist/relaybyte-symbol.svg", import.meta.url)),
    access(new URL("../dist/CNAME", import.meta.url)),
    access(new URL("../dist/.nojekyll", import.meta.url)),
    access(new URL("../dist/404.html", import.meta.url)),
  ]);
  assert.equal((await output("CNAME")).trim(), "styleport.app");
  assert.match(await output("robots.txt"), /Allow: \/$/m);
  assert.doesNotMatch(await output("robots.txt"), /Disallow/);
});
