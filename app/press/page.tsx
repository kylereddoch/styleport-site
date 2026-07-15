/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { PageIntro, SiteFooter, SiteHeader } from "../components";

export const metadata: Metadata = {
  title: "Press Kit — StylePort",
  description: "StylePort facts, boilerplate, screenshots, and brand assets for editorial use.",
};

export default function PressPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageIntro eyebrow="Press kit" title="Everything needed to cover StylePort.">
          <p>
            Product facts, approved boilerplate, and high-resolution assets for
            reviews, articles, videos, and app roundups.
          </p>
        </PageIntro>

        <section className="press-layout shell">
          <article className="press-copy">
            <p className="eyebrow">Boilerplate</p>
            <h2>About StylePort</h2>
            <p className="boilerplate">
              StylePort is a free, open-source UserCSS manager designed first
              for Safari. It lets people import plain CSS and UserCSS themes,
              configure variables, match styles to websites, edit and update
              them, and keep backups—all without analytics, advertising,
              tracking, or an account. StylePort is a GPL-3.0 downstream project
              based on the mature Stylus engine, with upstream history and
              attribution preserved.
            </p>
          </article>

          <aside className="fact-card">
            <h2>Quick facts</h2>
            <dl>
              <div><dt>Developer</dt><dd>Kyle Reddoch</dd></div>
              <div><dt>Platform</dt><dd>macOS 14+ · Safari</dd></div>
              <div><dt>Price</dt><dd>Free</dd></div>
              <div><dt>License</dt><dd>GPL-3.0-only</dd></div>
              <div><dt>Release</dt><dd>Version 1.0 in development</dd></div>
              <div><dt>Privacy</dt><dd>No tracking or developer data collection</dd></div>
            </dl>
          </aside>
        </section>

        <section className="section shell assets-section">
          <div className="section-heading">
            <p className="eyebrow">Editorial assets</p>
            <h2>Icon and screenshots.</h2>
            <p>Available for editorial use. Keep the icon’s proportions and do not recolor it.</p>
          </div>
          <div className="asset-grid">
            <article className="asset-card icon-asset">
              <div className="asset-preview"><img src="/press/styleport-icon-1024.png" alt="StylePort app icon" width="1024" height="1024" /></div>
              <div><h3>App icon</h3><p>PNG · 1024 × 1024</p></div>
              <a href="/press/styleport-icon-1024.png" download>Download PNG</a>
            </article>
            <article className="asset-card wide-asset">
              <div className="asset-preview"><img src="/press/import-style.png" alt="StylePort import screen" width="1570" height="971" /></div>
              <div><h3>Import screen</h3><p>PNG · Safari development build</p></div>
              <a href="/press/import-style.png" download>Download PNG</a>
            </article>
            <article className="asset-card wide-asset">
              <div className="asset-preview"><img src="/press/style-manager.png" alt="StylePort style manager" width="1570" height="971" /></div>
              <div><h3>Style manager</h3><p>PNG · Safari development build</p></div>
              <a href="/press/style-manager.png" download>Download PNG</a>
            </article>
          </div>
        </section>

        <section className="section shell attribution-note">
          <div>
            <p className="eyebrow">Attribution</p>
            <h2>Independent, with its history intact.</h2>
          </div>
          <p>
            StylePort changes are copyright 2026 Kyle Reddoch and contributors.
            The upstream foundation is copyright the Stylus Team and
            contributors. StylePort preserves the upstream Git history,
            copyright notices, and contributor attribution.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
