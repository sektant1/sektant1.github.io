import type { Metadata, Viewport } from "next"
import Script from "next/script"
import "@/styles/globals.css"
import { ClassificationBar } from "@/components/layout/classification-bar"
import {
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/site"
import {
  BANNER_FONT_OPTIONS,
  BANNER_FONT_STORAGE_KEY,
  DEFAULT_BANNER_FONT,
} from "@/lib/banner-font"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  keywords: SITE_KEYWORDS,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      { url: "/opengraph-image.png", width: 1200, height: 630, alt: SITE_NAME },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: { email: false, address: false, telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#04140a",
}

const siteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  author: { "@type": "Person", name: SITE_AUTHOR, url: SITE_URL },
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/posts?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
}

const coldBootSetup = `(function(){try{if(localStorage.getItem("cold-boot-seen")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.coldBoot="skip";return}document.documentElement.dataset.coldBoot="run";var link=document.createElement("link");link.rel="preload";link.as="fetch";link.href="/models/bitcoin.glb";link.type="model/gltf-binary";link.crossOrigin="anonymous";link.fetchPriority="high";document.head.appendChild(link)}catch(error){document.documentElement.dataset.coldBoot="skip"}})()`
const bannerFontSetup = `(function(){try{var value=localStorage.getItem(${JSON.stringify(BANNER_FONT_STORAGE_KEY)});if(${JSON.stringify(BANNER_FONT_OPTIONS.map((option) => option.id))}.includes(value)){document.documentElement.dataset.asciiFont=value}}catch(error){}})()`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // A phosphor tube has one mode. The class is fixed rather than toggled, so
    // the toolkit's dark-only treatments — the bloom, the scanlines — are
    // always on and there is no theme flash to script around.
    <html
      lang="en"
      className="dark"
      data-ascii-font={DEFAULT_BANNER_FONT}
      suppressHydrationWarning
    >
      <head>
        <Script id="banner-font-setup" strategy="beforeInteractive">
          {bannerFontSetup}
        </Script>
        <Script id="cold-boot-setup" strategy="beforeInteractive">
          {coldBootSetup}
        </Script>
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} RSS`}
          href="/rss.xml"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </head>
      {/* The CRT overlay lives on the body so it covers the whole screen —
          chrome included — as one layer, rather than being re-drawn per
          region. */}
      {/* A flex column so the banner takes its rule and the shell below gets
          exactly the rest of the viewport, rather than being pushed off it. */}
      <body className="tube-face flex h-svh flex-col overflow-hidden">
        {/* The drifting refresh band. An element rather than a pseudo-element
            because the two pseudos on .tube-face are already spoken for. */}
        <div aria-hidden="true" className="tube-roll" />

        <ClassificationBar />

        <div className="flex min-h-0 flex-1">{children}</div>
      </body>
    </html>
  )
}
