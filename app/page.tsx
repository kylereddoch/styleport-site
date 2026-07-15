/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "./components";

export const metadata: Metadata = {
  title: "StylePort — UserCSS for Safari",
  description:
    "A private, Safari-first manager for importing, configuring, editing, and applying your own CSS and UserCSS themes.",
};

const features = [
  {
    mark: "01",
    title: "Import without friction",
    text: "Choose a local .css or .user.css file, paste CSS directly, or review a style from a URL before installing it.",
  },
  {
    mark: "02",
    title: "Make themes yours",
    text: "Adjust colors, ranges, toggles, select menus, text, and image variables exposed by UserCSS themes.",
  },
  {
    mark: "03",
    title: "Apply precisely",
    text: "Match styles to domains, URLs, URL prefixes, and regular expressions with the mature Stylus matching engine.",
  },
  {
    mark: "04",
    title: "Keep control",
    text: "Enable, disable, edit, reorder, back up, restore, and update styles from one focused library.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero shell">
          <div className="hero-copy">
            <p className="eyebrow">Safari-first UserCSS manager</p>
            <h1>
              The web,
              <span>wearing your colors.</span>
            </h1>
            <p className="hero-lede">
              Import plain CSS and UserCSS themes, tune their variables, and
              make the sites you use feel like yours—without handing over your
              browsing history.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#download">
                Get StylePort <span aria-hidden="true">↓</span>
              </a>
              <a className="button secondary" href="#features">
                See what it does
              </a>
            </div>
            <div className="trust-row" aria-label="Product details">
              <span>macOS 14+</span>
              <span>Free &amp; open source</span>
              <span>No account</span>
            </div>
          </div>

          <div className="hero-demo" aria-label="StylePort style manager preview">
            <div className="demo-topbar">
              <span className="traffic-lights" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="demo-address">Style manager · StylePort</span>
              <span className="demo-status">Local</span>
            </div>
            <div className="demo-body">
              <aside>
                <div className="demo-wordmark">STYLEPORT</div>
                <strong>Style library</strong>
                <span className="demo-search">Search styles</span>
                <span>＋ New style</span>
                <span className="demo-active">⇧ Import style</span>
                <small>Stored on this Mac</small>
              </aside>
              <div className="demo-content">
                <div className="demo-style-card">
                  <span className="demo-check">✓</span>
                  <div>
                    <strong>Midnight for Mastodon</strong>
                    <small>Enabled · 4 target sites</small>
                  </div>
                  <span className="demo-pill">USERCSS</span>
                </div>
                <div className="demo-code" aria-hidden="true">
                  <span>--accent: #8aadf4;</span>
                  <span>--surface: #181926;</span>
                  <span>--radius: 14px;</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="marquee" aria-label="StylePort capabilities">
          <div>
            <span>PLAIN CSS</span><i>✦</i><span>USERCSS</span><i>✦</i>
            <span>VARIABLES</span><i>✦</i><span>URL MATCHING</span><i>✦</i>
            <span>BACKUPS</span><i>✦</i><span>UPDATES</span>
          </div>
        </section>

        <section className="section shell" id="features">
          <div className="section-heading split-heading">
            <div>
              <p className="eyebrow">A proper home for your CSS</p>
              <h2>Everything your styles need.</h2>
            </div>
            <p>
              StylePort brings a proven UserCSS engine to Safari and reshapes
              the experience around clarity, reliability, and WebKit.
            </p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.mark}>
                <span className="feature-mark">{feature.mark}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section shell visual-section">
          <div className="product-shot">
            <img
              src="/press/import-style.png"
              alt="StylePort import screen in Safari with file, URL, and pasted CSS choices"
              width="1570"
              height="971"
            />
          </div>
          <div className="visual-copy">
            <p className="eyebrow">One import door</p>
            <h2>File, URL, or paste. Your choice.</h2>
            <p>
              One deliberate import flow replaces scattered upload actions.
              Every style is reviewed before installation, whether it came from
              your Mac or a URL you supplied.
            </p>
            <ul className="check-list">
              <li><span>✓</span> Preview metadata before installing</li>
              <li><span>✓</span> Give plain CSS a clear name</li>
              <li><span>✓</span> Keep backup restore separate and explicit</li>
            </ul>
          </div>
        </section>

        <section className="privacy-band">
          <div className="shell privacy-grid">
            <div>
              <p className="eyebrow">Private by design</p>
              <h2>Your browsing is not the product.</h2>
            </div>
            <div className="privacy-points">
              <article>
                <strong>Local storage</strong>
                <p>Your styles and settings stay in Safari extension storage on your Mac.</p>
              </article>
              <article>
                <strong>No surveillance</strong>
                <p>No analytics, advertising, tracking, telemetry, or StylePort account.</p>
              </article>
              <article>
                <strong>Explainable access</strong>
                <p>Website permission is used only to match and apply the styles you choose.</p>
              </article>
              <Link href="/privacy" className="text-link">
                Read the complete privacy policy <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="section shell pricing-section" id="pricing">
          <div className="section-heading centered-heading">
            <p className="eyebrow">Simple on purpose</p>
            <h2>Free means the whole app.</h2>
            <p>
              No subscription, no premium feature gate, and no separate plans
              to decode.
            </p>
          </div>
          <div className="price-card">
            <div>
              <span className="price-label">StylePort</span>
              <div className="price">$0</div>
              <p>For everyone, with every feature.</p>
            </div>
            <ul className="check-list">
              <li><span>✓</span> Full UserCSS manager</li>
              <li><span>✓</span> Free and open-source</li>
              <li><span>✓</span> Optional support—never required</li>
            </ul>
            <div className="support-note">
              <strong>Want to help?</strong>
              <p>
                Optional supporter links will be added at launch. Support will
                fund signing, hosting, testing, and continued development—not
                unlock a different edition.
              </p>
            </div>
          </div>
        </section>

        <section className="download-section" id="download">
          <div className="shell download-grid">
            <div>
              <p className="eyebrow">Version 1.0 for macOS</p>
              <h2>Almost ready to dock.</h2>
              <p>
                StylePort is being tested and prepared for Developer ID signing
                and Apple notarization. Public downloads will open after those
                release checks are complete.
              </p>
            </div>
            <div className="download-card">
              <img src="/styleport-icon.png" alt="StylePort app icon" width="64" height="64" />
              <div>
                <strong>StylePort for Safari</strong>
                <span>macOS 14 or newer</span>
              </div>
              <button type="button" disabled>
                Coming soon
              </button>
              <Link href="/updates">Follow release progress →</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
