import type { Metadata } from "next";
import { PageIntro, SiteFooter, SiteHeader } from "../components";

export const metadata: Metadata = {
  title: "Support — StylePort",
  description: "Install, enable, update, and troubleshoot StylePort for Safari.",
};

const questions = [
  {
    question: "Why is StylePort both an app and a Safari extension?",
    answer:
      "Safari Web Extensions are packaged inside a macOS app. The app installs the extension and gives you a visible place to confirm its status; the extension supplies the browser toolbar and UserCSS features.",
  },
  {
    question: "Why does Safari say StylePort can read and alter webpages?",
    answer:
      "Applying CSS requires access to the webpages you choose. StylePort uses that permission to match a page and insert your selected CSS. It does not use the permission to create or transmit a browsing history.",
  },
  {
    question: "Where are my styles stored?",
    answer:
      "Styles, variables, and preferences live in Safari's local extension storage on your Mac. StylePort has no account or developer-operated cloud database.",
  },
  {
    question: "Can I import an existing Stylus backup?",
    answer:
      "StylePort is built on the mature Stylus engine and the migration path for compatible backups is part of the release work. Always keep your original backup until a restore has been verified.",
  },
  {
    question: "How will updates work?",
    answer:
      "The first public release will be signed and notarized. Direct-download builds are planned to use a signed update feed so StylePort can notify you, show release notes, and install a verified update. The exact updater will be finalized with release signing.",
  },
  {
    question: "Will StylePort be available for iPhone or iPad?",
    answer:
      "The first release targets macOS Safari. An iOS and iPadOS container is on the roadmap after the Mac experience and release process are reliable.",
  },
];

export default function SupportPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageIntro eyebrow="Help & support" title="Start with the simple answer.">
          <p>
            Installation guidance, permission explanations, and honest release
            status for StylePort.
          </p>
        </PageIntro>

        <section className="support-layout shell">
          <aside className="support-card">
            <p className="eyebrow">Need a hand?</p>
            <h2>Report a problem</h2>
            <p>
              Include your macOS version, Safari version, StylePort version,
              and the smallest style that reproduces the issue. Never include
              private browsing data.
            </p>
            <a className="button primary" href="https://github.com/kylereddoch/styleport/issues">
              Open an issue
            </a>
          </aside>
          <div className="faq-list">
            {questions.map((item) => (
              <details key={item.question}>
                <summary>{item.question}<span aria-hidden="true">＋</span></summary>
                <p>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="section shell install-guide">
          <div className="section-heading">
            <p className="eyebrow">After launch</p>
            <h2>Install in four steps.</h2>
          </div>
          <ol>
            <li><span>1</span><strong>Download</strong><p>Get the signed StylePort disk image from this site.</p></li>
            <li><span>2</span><strong>Move</strong><p>Drag StylePort into your Applications folder and open it.</p></li>
            <li><span>3</span><strong>Enable</strong><p>Turn on StylePort in Safari Settings → Extensions.</p></li>
            <li><span>4</span><strong>Style</strong><p>Grant the sites you choose, then import your CSS or UserCSS.</p></li>
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
