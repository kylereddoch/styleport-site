import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "parse5";
import { jsonLd, structuredData } from "../lib/seo.js";

const site = JSON.parse(await readFile(new URL("../src/_data/site.json", import.meta.url)));
const routes = ["/", "/privacy/", "/support/", "/press/", "/roadmap/"];
const fileFor = (route) => new URL(`../dist${route}${route.endsWith("/") ? "index.html" : ""}`, import.meta.url);
const attr = (node, name) => node.attrs?.find((entry) => entry.name === name)?.value;
const content = (node) => node?.childNodes?.map((child) => child.value ?? content(child)).join("") ?? "";
function all(node, tag) {
  return [...(node.tagName === tag ? [node] : []), ...(node.childNodes ?? []).flatMap((child) => all(child, tag))];
}
async function page(route) {
  return parse(await readFile(fileFor(route), "utf8"));
}
function meta(doc, name) {
  const matches = all(doc, "meta").filter((node) => attr(node, "name") === name || attr(node, "property") === name);
  assert.equal(matches.length, 1, `exactly one ${name}`);
  return attr(matches[0], "content");
}

test("every indexable page has unique search copy, matching canonical URLs, and complete sharing metadata", async () => {
  const titles = new Set();
  const descriptions = new Set();
  for (const route of routes) {
    const doc = await page(route);
    const titleNodes = all(doc, "title");
    assert.equal(titleNodes.length, 1, route);
    const title = content(titleNodes[0]);
    const description = meta(doc, "description");
    assert.ok(title.length > 0 && description.length > 0, route);
    assert.ok(!titles.has(title), `unique title for ${route}`);
    assert.ok(!descriptions.has(description), `unique description for ${route}`);
    titles.add(title);
    descriptions.add(description);
    const canonicals = all(doc, "link").filter((node) => attr(node, "rel") === "canonical");
    assert.equal(canonicals.length, 1, route);
    assert.equal(attr(canonicals[0], "href"), `${site.url}${route}`);
    assert.equal(meta(doc, "og:url"), `${site.url}${route}`);
    assert.equal(meta(doc, "robots"), "index, follow, max-image-preview:large");
    assert.equal(meta(doc, "og:title"), title);
    assert.equal(meta(doc, "twitter:title"), title);
    assert.equal(meta(doc, "og:description"), description);
    assert.equal(meta(doc, "twitter:description"), description);
    assert.equal(meta(doc, "og:type"), "website");
    assert.equal(meta(doc, "og:site_name"), site.name);
    assert.equal(meta(doc, "og:locale"), "en_US");
    assert.equal(meta(doc, "twitter:card"), "summary_large_image");
    assert.equal(meta(doc, "og:image"), `${site.url}${site.socialImage.path}`);
    assert.equal(meta(doc, "twitter:image"), meta(doc, "og:image"));
    assert.equal(meta(doc, "og:image:secure_url"), meta(doc, "og:image"));
    assert.equal(meta(doc, "og:image:alt"), site.socialImage.alt);
    assert.equal(meta(doc, "twitter:image:alt"), site.socialImage.alt);
    assert.equal(meta(doc, "og:image:type"), "image/png");
    assert.equal(meta(doc, "og:image:width"), String(site.socialImage.width));
    assert.equal(meta(doc, "og:image:height"), String(site.socialImage.height));
    assert.equal(all(doc, "h1").length, 1, route);
    for (const img of all(doc, "img")) assert.notEqual(attr(img, "alt"), undefined, route);
  }
});

test("utility pages remain crawlable but cannot be indexed or appear in the sitemap", async () => {
  for (const route of ["/thanks/", "/404.html", "/updates/"]) {
    assert.equal(meta(await page(route), "robots"), "noindex, follow", route);
  }
  const xml = await readFile(new URL("../dist/sitemap.xml", import.meta.url), "utf8");
  const locations = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations.sort(), routes.map((route) => `${site.url}${route}`).sort());
  assert.equal(new Set(locations).size, locations.length);
  const robots = await readFile(new URL("../dist/robots.txt", import.meta.url), "utf8");
  assert.ok(robots.includes(`Sitemap: ${site.url}/sitemap.xml`));
  assert.doesNotMatch(robots, /Disallow:\s*\//);
  const redirect = await page("/updates/");
  assert.equal(attr(all(redirect, "link")[0], "href"), `${site.url}/roadmap/`);
});

test("structured data parses, matches page content, and preserves prerelease and developer identity", async () => {
  for (const route of routes) {
    const doc = await page(route);
    const scripts = all(doc, "script").filter((node) => attr(node, "type") === "application/ld+json");
    assert.equal(scripts.length, 1);
    const data = JSON.parse(content(scripts[0]));
    assert.equal(data["@context"], "https://schema.org");
    const graph = data["@graph"];
    const webpage = graph.find((entry) => entry["@type"] === "WebPage");
    assert.equal(webpage.url, `${site.url}${route}`);
    assert.equal(webpage.name, content(all(doc, "title")[0]));
    assert.equal(webpage.description, meta(doc, "description"));
    const person = graph.find((entry) => entry["@type"] === "Person");
    assert.equal(person.name, "Kyle Reddoch");
    assert.equal(person.brand["@type"], "Brand");
    const website = graph.find((entry) => entry["@type"] === "WebSite");
    assert.equal(website.publisher["@id"], person["@id"]);
    const app = graph.find((entry) => entry["@type"] === "SoftwareApplication");
    if (route === "/") {
      assert.equal(app.operatingSystem, "macOS 14 or newer");
      assert.match(app.description, /In development/);
      for (const key of ["offers", "aggregateRating", "review", "downloadUrl", "installUrl", "softwareVersion"])
        assert.equal(app[key], undefined, `no unverified ${key}`);
    } else assert.equal(app, undefined);
  }
});

test("social and touch images ship with dimensions that match the metadata", async () => {
  for (const [path, width, height] of [[site.socialImage.path, 1200, 630], ["/apple-touch-icon.png", 180, 180]]) {
    const png = await readFile(new URL(`../dist${path}`, import.meta.url));
    assert.equal(png.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(png.readUInt32BE(16), width);
    assert.equal(png.readUInt32BE(20), height);
    assert.ok(png.length < 5 * 1024 * 1024, "image stays below 5 MB");
  }
});

test("local navigation, anchors, and asset references resolve in the generated site", async () => {
  for (const route of [...routes, "/thanks/", "/404.html", "/updates/"]) {
    const doc = await page(route);
    const references = [...all(doc, "a"), ...all(doc, "link"), ...all(doc, "img"), ...all(doc, "script")];
    for (const node of references) {
      const ref = attr(node, "href") || attr(node, "src");
      if (!ref) continue;
      const url = new URL(ref, `${site.url}${route}`);
      if (url.origin !== site.url) continue;
      await access(fileFor(url.pathname));
      if (url.hash && (url.pathname.endsWith("/") || url.pathname.endsWith(".html"))) {
        const target = await page(url.pathname);
        const ids = [];
        const visit = (node) => { if (attr(node, "id")) ids.push(attr(node, "id")); (node.childNodes ?? []).forEach(visit); };
        visit(target);
        assert.ok(ids.includes(decodeURIComponent(url.hash.slice(1))), `${route}: ${ref}`);
      }
    }
  }
});

test("structured data safely serializes quotes and closing script tags", () => {
  const hostile = '</script><script>alert("test")</script>&';
  assert.equal(JSON.parse(jsonLd({ text: hostile })).text, hostile);
  assert.doesNotMatch(jsonLd({ text: hostile }), /[<>&]/);
  const output = structuredData(site, hostile, hostile, "/support/");
  assert.doesNotMatch(output, /<\/script/i);
  assert.equal(JSON.parse(output)["@graph"].find((entry) => entry["@type"] === "WebPage").name, hostile);
});
