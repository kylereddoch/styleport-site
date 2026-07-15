import type { Metadata } from "next";
import { PageIntro, SiteFooter, SiteHeader } from "../components";

export const metadata: Metadata = {
  title: "Updates — StylePort",
  description: "StylePort release status, release notes, and update plans.",
};

export default function UpdatesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageIntro eyebrow="Release notes" title="What’s shipping next.">
          <p>
            Public release history will live here. StylePort 1.0 is currently
            in development and is not yet available as a signed download.
          </p>
        </PageIntro>

        <section className="timeline shell">
          <article className="timeline-item current">
            <div className="timeline-marker" />
            <div className="timeline-meta"><span>In development</span><time>2026</time></div>
            <div className="timeline-content">
              <p className="eyebrow">Version 1.0</p>
              <h2>Safari foundation and product experience</h2>
              <ul>
                <li>Plain CSS and UserCSS import from file, URL, or paste</li>
                <li>UserCSS metadata, variables, compilation, and URL matching</li>
                <li>Style library, editing, updates, export, and backup restore</li>
                <li>Safari permission diagnostics and injection reliability work</li>
                <li>Native macOS container, Developer ID signing, and notarization</li>
              </ul>
            </div>
          </article>
          <article className="timeline-item planned">
            <div className="timeline-marker" />
            <div className="timeline-meta"><span>Planned</span><time>After 1.0</time></div>
            <div className="timeline-content">
              <p className="eyebrow">Signed updates</p>
              <h2>Release notifications without guesswork</h2>
              <p>
                Direct-download builds are planned to use a signed update feed.
                StylePort will be able to check a small release feed, present
                these release notes, verify the update signature, and install
                the new notarized build after you approve it.
              </p>
            </div>
          </article>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
