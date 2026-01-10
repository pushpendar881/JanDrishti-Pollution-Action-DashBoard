import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/lib/query-client"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "sonner"
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
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="antialiased selection:bg-primary/30 selection:text-primary">
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              {children}
              <Toaster />
              <Analytics />
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
