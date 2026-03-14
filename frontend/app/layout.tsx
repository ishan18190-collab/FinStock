import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import Link from "next/link";

import { ModeToggle } from "@/components/mode-toggle";
import { MarketTicker } from "@/components/market-ticker";
import { ThemeProvider } from "@/components/theme-provider";
import { NavUser } from "@/components/nav-user";
import ClickSpark from "@/components/ClickSpark";

import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "FinStock",
  description: "AI powered Indian stock intelligence platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${space.variable} min-h-screen font-[var(--font-manrope)]`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ClickSpark
            sparkColor='#159A9C'
            sparkSize={10}
            sparkRadius={15}
            sparkCount={8}
            duration={400}
          >
            <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur">
              <div className="mx-auto flex max-w-[1640px] items-center justify-between px-4 py-3 md:px-6">
                <div className="flex items-center gap-8">
                  <Link href="/" className="group block">
                    <p className="font-[var(--font-space)] text-xl font-bold tracking-tight transition-colors group-hover:text-primary">FinStock</p>
                    <p className="mt-1 text-xs text-muted">NSE/BSE Intelligence Platform</p>
                  </Link>
                  
                  <nav className="hidden md:flex items-center gap-6">
                    <Link href="/" className="text-sm font-semibold text-muted hover:text-text transition-colors relative group">
                      Dashboard
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                    <Link href="/#heatmap" className="text-sm font-semibold text-muted hover:text-text transition-colors relative group">
                      Markets
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                    <Link href="/#news" className="text-sm font-semibold text-muted hover:text-text transition-colors relative group">
                      News
                      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
                    </Link>
                  </nav>
                </div>

                <div className="flex items-center gap-3">
                  <NavUser />
                  <ModeToggle />
                </div>
              </div>
              <MarketTicker />
            </header>
            <main className="mx-auto max-w-[1640px] px-4 py-4 md:px-6 md:py-6">{children}</main>
          </ClickSpark>
        </ThemeProvider>
      </body>
    </html>
  );
}
