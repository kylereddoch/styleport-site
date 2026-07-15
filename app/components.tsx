import Link from "next/link";
import Image from "next/image";

const navigation = [
  { href: "/#features", label: "Features" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/press", label: "Press" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link className="brand" href="/" aria-label="StylePort home">
          <Image src="/styleport-icon.png" alt="" width={42} height={42} />
          <span>StylePort</span>
        </Link>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <a className="nav-cta" href="#download">
          Get StylePort
        </a>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="brand footer-brand" href="/">
            <Image src="/styleport-icon.png" alt="" width={38} height={38} />
            <span>StylePort</span>
          </Link>
          <p>Bring your style to the web.</p>
        </div>
        <div className="footer-links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/support">Support</Link>
          <Link href="/updates">Updates</Link>
          <Link href="/press">Press kit</Link>
          <a href="https://github.com/kylereddoch/styleport">Source code</a>
        </div>
      </div>
      <div className="shell footer-fineprint">
        <span>© 2026 Kyle Reddoch and StylePort contributors.</span>
        <span>GPL-3.0 · Based on the Stylus engine with attribution.</span>
      </div>
    </footer>
  );
}

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-intro shell">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <div className="page-lede">{children}</div>
    </section>
  );
}
