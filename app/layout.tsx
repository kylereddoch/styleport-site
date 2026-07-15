import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "StylePort — UserCSS for Safari",
    description:
      "A private, Safari-first manager for importing, configuring, editing, and applying your own CSS and UserCSS themes.",
    icons: {
      icon: "/styleport-icon.png",
      shortcut: "/styleport-icon.png",
      apple: "/styleport-icon.png",
    },
    openGraph: {
      title: "StylePort — UserCSS for Safari",
      description: "Bring your style to the web. Private, local, and open source.",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1729, height: 910 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "StylePort — UserCSS for Safari",
      description: "Bring your style to the web. Private, local, and open source.",
      images: [`${origin}/og.png`],
    },
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        "max-video-preview": 0,
        "max-image-preview": "none",
        "max-snippet": 0,
      },
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
