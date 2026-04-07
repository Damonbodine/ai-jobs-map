import type { Metadata } from "next"
import { Newsreader, Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { SITE, AGENCY } from "@/lib/site"
import "./globals.css"

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    title: SITE.name,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
  },
  authors: [{ name: AGENCY.name, url: AGENCY.url }],
  creator: AGENCY.name,
  publisher: AGENCY.name,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${newsreader.variable} ${manrope.variable} font-body min-h-screen flex flex-col`}
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
