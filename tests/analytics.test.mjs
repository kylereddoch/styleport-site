import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "parse5";

const routes = ["index.html", "privacy/index.html", "support/index.html", "press/index.html", "roadmap/index.html", "thanks/index.html", "404.html"];
const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
function all(node, tag) {
  return [...(node.tagName === tag ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => all(child, tag))];
}
const output = (path) => readFile(new URL(`../dist/${path}`, import.meta.url), "utf8");
const directRelease = JSON.parse(await readFile(
  new URL("../src/_data/directRelease.json", import.meta.url), "utf8"));

test("content pages load one deferred Tinylytics embed with events and navigation-safe delivery", async () => {
  for (const route of routes) {
    const scripts = all(parse(await output(route)), "script").filter((node) => attr(node, "src")?.includes("tinylytics.app"));
    assert.equal(scripts.length, 1, route);
    assert.equal(attr(scripts[0], "src"), "https://tinylytics.app/embed/tTzAhbA2NvZs7NRThEx9.js?events&beacon");
    assert.notEqual(attr(scripts[0], "defer"), undefined);
  }
  // The immediate compatibility redirect must not count a second page view.
  assert.doesNotMatch(await output("updates/index.html"), /tinylytics/);
});

test("outbound, contact, and download links have meaningful events without sending raw destinations", async () => {
  const seen = new Set();
  let downloads = 0;
  let betaLinks = 0;
  for (const route of routes) {
    for (const node of all(parse(await output(route)), "a")) {
      const href = attr(node, "href");
      const event = attr(node, "data-tinylytics-event");
      const value = attr(node, "data-tinylytics-event-value");
      let expected;
      if (href.startsWith("https://testflight.apple.com/")) { expected = "app.testflight"; betaLinks++; }
      else if (href.startsWith("https://buy.stripe.com/")) expected = "support.checkout";
      else if (href.startsWith("mailto:")) expected = "contact.email";
      else if (attr(node, "download") !== undefined) { expected = "file.download"; downloads++; }
      else if (href.startsWith("https://")) expected = "link.outbound";
      else if (href.endsWith("#download")) expected = "cta.download";
      else if (href.endsWith("#features")) expected = "cta.features";
      if (expected) assert.equal(event, expected, `${route}: ${href}`);
      if (event) {
        assert.match(event, /^[a-z]+\.[a-z]+$/);
        assert.match(value, /^[a-zA-Z0-9_.-]+$/, "fixed label, without URL, email, or query data");
        seen.add(event);
      }
    }
  }
  assert.equal(downloads, directRelease.available ? 8 : 5);
  assert.equal(betaLinks, 2);
  assert.deepEqual([...seen].sort(), ["app.testflight", "contact.email", "cta.download", "cta.features", "file.download", "link.outbound", "support.checkout"]);
});

test("privacy distinguishes app behavior from website analytics and discloses the provider", async () => {
  const html = await output("privacy/index.html");
  for (const text of ["The StylePort app", "Tinylytics receives the page URL and path", "up to 12 hours", "does not set visitor cookies", "fixed label", "do not confirm an installation", "tiny_ignore", "Effective October 27, 2026"]) {
    assert.ok(html.includes(text), text);
  }
  assert.doesNotMatch(html, /does not use advertising trackers, analytics scripts/);
  const links = all(parse(html), "a").map((node) => attr(node, "href"));
  assert.ok(links.includes("https://tinylytics.app/docs/trust/privacy"));
  assert.ok(links.includes("https://tinylytics.app/docs/privacy"));
  assert.ok(links.includes("https://tinylytics.app/docs/analytics/ignore-hits"));
});
