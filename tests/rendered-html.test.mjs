import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const testEnv = {
  PREVIEW_PASSWORD: "styleport-test-password",
  PREVIEW_SESSION_SECRET: "styleport-test-session-secret",
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

async function loadWorker(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  return (await import(workerUrl.href)).default;
}

async function render(pathname = "/") {
  const worker = await loadWorker(pathname);
  const body = new URLSearchParams({
    password: testEnv.PREVIEW_PASSWORD,
    returnTo: pathname,
  });
  const login = await worker.fetch(
    new Request("http://localhost/__preview/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    }),
    testEnv,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(login.status, 303);
  const cookie = login.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html", cookie },
    }),
    testEnv,
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("requires the shared preview password and blocks indexing", async () => {
  const worker = await loadWorker("unauthenticated");
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    testEnv,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 401);
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
  assert.match(await response.text(), /Enter the shared password/);

  const robots = await worker.fetch(
    new Request("http://localhost/robots.txt"),
    testEnv,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(robots.status, 200);
  assert.match(await robots.text(), /Disallow: \//);
});

test("server-renders the StylePort product page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>StylePort — UserCSS for Safari<\/title>/i);
  assert.match(html, /The web,/);
  assert.match(html, /wearing your colors/);
  assert.match(html, /Free means the whole app/);
  assert.match(html, /Coming soon/);
  assert.match(html, /og\.png/);
  assert.match(html, /name="robots" content="noindex, follow, nocache"|name="robots" content="noindex, nofollow/i);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("renders every public information route", async () => {
  const routes = [
    ["/privacy", /Your styles stay yours/],
    ["/support", /Start with the simple answer/],
    ["/press", /Everything needed to cover StylePort/],
    ["/updates", /What’s shipping next/],
  ];

  for (const [pathname, expected] of routes) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(await response.text(), expected, pathname);
  }
});

test("ships real product assets and no starter preview", async () => {
  const [layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /StylePort — UserCSS for Safari/);
  assert.match(layout, /og\.png/);
  assert.match(page, /Coming soon/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/styleport-icon.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app\/_sites-preview", import.meta.url)));
});
