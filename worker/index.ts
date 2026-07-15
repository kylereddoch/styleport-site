/** Cloudflare Worker entry point for the StylePort website. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  PREVIEW_PASSWORD?: string;
  PREVIEW_SESSION_SECRET?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const LOGIN_PATH = "/__preview/login";
const LOGOUT_PATH = "/__preview/logout";
const SESSION_COOKIE = "styleport_preview";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/robots.txt") {
      return noIndex(
        new Response("User-agent: *\nDisallow: /\n", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
    }

    if (!env.PREVIEW_PASSWORD || !env.PREVIEW_SESSION_SECRET) {
      return noIndex(
        new Response("Preview access is not configured.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
    }

    if (url.pathname === LOGIN_PATH) {
      return handleLogin(request, env);
    }

    if (url.pathname === LOGOUT_PATH) {
      return noIndex(
        new Response(null, {
          status: 303,
          headers: {
            Location: LOGIN_PATH,
            "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
          },
        }),
      );
    }

    const expectedSession = await sessionToken(env.PREVIEW_SESSION_SECRET);
    const suppliedSession = readCookie(request.headers.get("Cookie"), SESSION_COOKIE);
    if (!suppliedSession || !constantTimeEqual(suppliedSession, expectedSession)) {
      const returnTo = `${url.pathname}${url.search}`;
      return loginPage(returnTo, false);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return noIndex(response);
    }

    return noIndex(await handler.fetch(request, env, ctx));
  },
};

export default worker;

async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") {
    const url = new URL(request.url);
    return loginPage(safeReturnTo(url.searchParams.get("returnTo")), false);
  }

  if (request.method !== "POST") {
    return noIndex(new Response("Method not allowed", { status: 405 }));
  }

  const form = await request.formData();
  const password = form.get("password");
  const returnTo = safeReturnTo(form.get("returnTo"));
  const matches =
    typeof password === "string" &&
    constantTimeEqual(
      await sha256(password),
      await sha256(env.PREVIEW_PASSWORD ?? ""),
    );

  if (!matches) return loginPage(returnTo, true);

  const token = await sessionToken(env.PREVIEW_SESSION_SECRET ?? "");
  return noIndex(
    new Response(null, {
      status: 303,
      headers: {
        Location: returnTo,
        "Set-Cookie": `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}`,
      },
    }),
  );
}

function loginPage(returnTo: string, invalid: boolean): Response {
  const error = invalid
    ? '<p class="error" role="alert">That password did not match. Try again.</p>'
    : "";
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
  <title>StylePort preview</title>
  <style>
    :root{color-scheme:dark;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0e1428;color:#f7f4ee}
    *{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 20% 15%,rgba(79,213,210,.14),transparent 32%),radial-gradient(circle at 85% 80%,rgba(109,93,252,.2),transparent 36%),#0e1428}
    main{width:min(430px,100%);padding:34px;border:1px solid #343c61;border-radius:24px;background:rgba(19,26,51,.92);box-shadow:0 30px 80px rgba(0,0,0,.35)}
    .mark{width:52px;height:52px;margin-bottom:25px;display:grid;place-items:center;border-radius:15px;background:linear-gradient(145deg,#4fd5d2,#6d5dfc);color:#10152a;font-size:26px;font-weight:900;box-shadow:0 12px 28px rgba(74,91,235,.25)}
    .eyebrow{margin:0 0 10px;color:#4fd5d2;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
    h1{margin:0;font-size:34px;line-height:1.05;letter-spacing:-.045em}p{color:#aeb6cf;line-height:1.6}form{margin-top:26px}label{display:block;margin-bottom:8px;font-size:13px;font-weight:700}
    input{width:100%;height:50px;padding:0 14px;color:white;background:#0d1327;border:1px solid #485172;border-radius:12px;outline:none}input:focus{border-color:#7e70ff;box-shadow:0 0 0 3px rgba(109,93,252,.18)}
    button{width:100%;height:50px;margin-top:12px;border:0;border-radius:12px;color:white;background:#6d5dfc;font-weight:800;cursor:pointer}button:hover{background:#5c4ce9}.error{margin:14px 0 0;color:#ff9f9f;font-size:13px}.fine{margin:22px 0 0;color:#727d9c;font-size:12px;text-align:center}
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true">S</div>
    <p class="eyebrow">Private development preview</p>
    <h1>Enter the shared password.</h1>
    <p>This temporary StylePort site is available only to invited reviewers.</p>
    ${error}
    <form action="${LOGIN_PATH}" method="post">
      <input type="hidden" name="returnTo" value="${escapeHtml(returnTo)}">
      <label for="password">Preview password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
      <button type="submit">Open StylePort preview</button>
    </form>
    <p class="fine">No account is required. Access expires after seven days.</p>
  </main>
</body>
</html>`;

  return noIndex(
    new Response(html, {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
      },
    }),
  );
}

function noIndex(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
  headers.set("Cache-Control", "private, no-store");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function sessionToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode("styleport-preview-v1"),
  );
  return base64Url(new Uint8Array(signature));
}

async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return base64Url(new Uint8Array(hash));
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const pair of header.split(";")) {
    const [key, ...value] = pair.trim().split("=");
    if (key === name) return value.join("=");
  }
  return null;
}

function safeReturnTo(value: FormDataEntryValue | string | null): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const parsed = new URL(value, "https://preview.local");
    return parsed.origin === "https://preview.local"
      ? `${parsed.pathname}${parsed.search}`
      : "/";
  } catch {
    return "/";
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
