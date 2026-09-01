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
  BANNER_FONT_IDS,
  BANNER_FONT_STORAGE_KEY,
  DEFAULT_BANNER_FONT,
} from "@/lib/banner-font"
import { COLD_BOOT_STORAGE_KEY, COLD_BOOT_TTL_MS } from "@/lib/cold-boot-state"
import { CRT_SCREEN_STORAGE_KEY } from "@/lib/crt-screen"
import { TUBES, TUBE_STORAGE_KEY } from "@/lib/tube"
import {
  BODY_FACE_IDS,
  BODY_FONT_FACE_PROPERTY,
  BODY_FONT_STORAGE_KEY,
  FACE_IDS,
  FONT_FACE_PROPERTY,
  FONT_STORAGE_KEY,
  SCALE_IDS,
  UI_SCALE_PROPERTY,
  UI_SCALE_STORAGE_KEY,
} from "@workspace/ui/components/font-picker"

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

// These all run before first paint, which is the whole point of them: they
// settle what the page looks like before React exists, so nothing flashes and
// gets corrected. Their storage keys come from the modules that own them rather
// than being spelled out again here — one place to change a key.
const coldBootSetup = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(COLD_BOOT_STORAGE_KEY)});var seen=Number(raw);var fresh=raw!==null&&isFinite(seen)&&seen>0&&Math.abs(Date.now()-seen)<${COLD_BOOT_TTL_MS};if(fresh||matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.dataset.coldBoot="skip";return}document.documentElement.dataset.coldBoot="run";var link=document.createElement("link");link.rel="preload";link.as="fetch";link.href="/models/bitcoin.glb";link.type="model/gltf-binary";link.crossOrigin="anonymous";link.fetchPriority="high";document.head.appendChild(link)}catch(error){document.documentElement.dataset.coldBoot="skip"}})()`
const bannerFontSetup = `(function(){try{var value=localStorage.getItem(${JSON.stringify(BANNER_FONT_STORAGE_KEY)});if(${JSON.stringify(BANNER_FONT_IDS)}.includes(value)){document.documentElement.dataset.asciiFont=value}}catch(error){}})()`
// Which phosphor the tube is coated with. Green is the default and needs no
// attribute, so only a stored amber writes one.
const tubeSetup = `(function(){try{var v=localStorage.getItem(${JSON.stringify(TUBE_STORAGE_KEY)});if(${JSON.stringify([...TUBES])}.includes(v)&&v!=="green"){document.documentElement.dataset.tube=v}}catch(error){}})()`
const crtScreenSetup = `(function(){try{if(localStorage.getItem(${JSON.stringify(CRT_SCREEN_STORAGE_KEY)})==="0"){document.documentElement.dataset.crt="off"}}catch(error){}})()`
// The reading settings — both faces and the interface scale — for the reason
// the three above exist: FontPicker sets them from an effect, which does not
// run until React has hydrated, so a reader who had chosen any of them watched
// the page paint wrong and then correct itself. The display picker had always
// done that; a body face doubles it, since a body swap moves every line of
// prose rather than just the headings, and a scale change reflows the lot.
const readingSetup = `(function(){var r=document.documentElement;function set(key,allowed,prop){try{var v=localStorage.getItem(key);if(allowed.includes(v)){r.style.setProperty(prop,v)}}catch(error){}}set(${JSON.stringify(FONT_STORAGE_KEY)},${JSON.stringify(FACE_IDS)},${JSON.stringify(FONT_FACE_PROPERTY)});set(${JSON.stringify(BODY_FONT_STORAGE_KEY)},${JSON.stringify(BODY_FACE_IDS)},${JSON.stringify(BODY_FONT_FACE_PROPERTY)});set(${JSON.stringify(UI_SCALE_STORAGE_KEY)},${JSON.stringify(SCALE_IDS)},${JSON.stringify(UI_SCALE_PROPERTY)})})()`

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
        <Script id="crt-screen-setup" strategy="beforeInteractive">
          {crtScreenSetup}
        </Script>
        <Script id="tube-setup" strategy="beforeInteractive">
          {tubeSetup}
        </Script>
        <Script id="reading-setup" strategy="beforeInteractive">
          {readingSetup}
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
        {/* The raster. Separate from the beam rows on ::after because the two
            are composited differently — the lit row adds light, the gap takes
            it away — and one element cannot carry both blend modes. */}
        <div aria-hidden="true" className="tube-raster crt-interlace" />

        <ClassificationBar />

        {/* The tube warms up once, when the document loads. It used to be on
            each page's own wrapper, so every navigation replayed a power-on —
            a screen that switches on again each time you open a post is not a
            screen, it is a transition effect. This element belongs to the
            layout and survives routing, so the animation runs on arrival and
            never again. */}
        <div className="tube-on flex min-h-0 flex-1">{children}</div>
      </body>
    </html>
  )
}
