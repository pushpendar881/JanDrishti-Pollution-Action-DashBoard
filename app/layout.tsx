import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: "JanDrishti | Pollution Action Dashboard",
  description: "Real-time air quality monitoring dashboard with interactive maps and pollution forecasts",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="antialiased selection:bg-primary/30 selection:text-primary">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
