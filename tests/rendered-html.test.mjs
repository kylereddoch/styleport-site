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
  assert.match(html, /Support StylePort/);
  assert.match(html, /https:\/\/buy\.stripe\.com\/14AeVd3QHai45bTeSn73G03/);
  assert.match(html, /class="shell footer-top"/);
  assert.match(html, /class="publisher-brand"/);
  assert.match(html, /class="shell footer-bottom"/);
  assert.match(html, /\/assets\/site\.css\?v=20260911-1/);
  assert.match(html, />Press Kit</);
  assert.match(html, /href="\/roadmap\/">Roadmap</);
  assert.match(html, /rel="icon" href="\/styleport-icon\.png"/);
  assert.doesNotMatch(html, />Source code</);
  assert.doesNotMatch(html, /Enter the shared password|noindex/i);
});

test("builds every public information route", async () => {
  const routes = [
    ["privacy/index.html", /Your styles stay yours/],
    ["support/index.html", /Start with the simple answer/],
    ["press/index.html", /Everything needed to cover StylePort/],
    ["roadmap/index.html", /Where StylePort is headed/],
    ["thanks/index.html", /You helped keep StylePort moving/],
  ];
  for (const [pathname, expected] of routes) {
    const html = await output(pathname);
    assert.match(html, expected, pathname);
    assert.doesNotMatch(html, /github\.com\/kylereddoch\/styleport/i, pathname);
    if (pathname === "privacy/index.html") {
      assert.match(html, /styleport-appearance/);
      assert.match(html, /Stripe-hosted checkout/);
      assert.match(html, /mailto:styleport@relaybyte\.dev/);
    }
  }
});

test("keeps the former updates URL as a roadmap redirect", async () => {
  const html = await output("updates/index.html");
  assert.match(html, /url=\/roadmap\//);
  assert.match(html, /content="noindex, follow"/);
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
