"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MarketHeatmap } from "@/components/market-heatmap";
import { MarketNews } from "@/components/market-news";
import { StockSearch } from "@/components/stock-search";
import { Loader2, ShieldAlert } from "lucide-react";
import DotGrid from "@/components/ui/dot-grid";
import ScrollFloat from "@/components/ui/scroll-float";

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <div className="flex flex-col items-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted">Authenticating Session</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-accent/50 uppercase tracking-widest">
            <ShieldAlert className="h-3 w-3" />
            Restricted Intelligence Access
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 py-8 animate-in fade-in duration-700 overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <DotGrid
          dotSize={3}
          gap={25}
          baseColor="#3D5A73"
          activeColor="#5227FF"
          proximity={150}
        />
      </div>

      <div className="relative z-10 space-y-8">
        <section className="rounded-[28px] border border-border/70 bg-panel/70 p-8 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Indian Equity Intelligence</p>
          <ScrollFloat
            animationDuration={1}
            ease='back.out(2)'
            scrollStart='top bottom'
            scrollEnd='bottom center'
            textClassName="mt-3 font-[var(--font-space)] text-4xl font-bold md:text-5xl"
            containerClassName="!my-0"
          >
            AI Stock Research For NSE and BSE
          </ScrollFloat>
          <p className="mt-3 max-w-3xl text-sm text-muted md:text-base">
            Analyze fundamentals, risk, sentiment, financial statements, corporate actions, and returns projection with one integrated fintech workspace.
          </p>
          <StockSearch className="mt-6 max-w-3xl" />
        </section>

        <section id="heatmap" className="mt-8 scroll-mt-32">
          <ScrollFloat
            animationDuration={0.7}
            ease='power4.out'
            textClassName="mb-2 text-xl font-bold font-[var(--font-space)]"
            containerClassName="!my-0"
          >
            Index Heatmap
          </ScrollFloat>
          <p className="mb-4 text-sm text-muted">All constituents by intraday move, with one-click access to each stock dashboard.</p>
          <MarketHeatmap />
        </section>

        <section id="news" className="scroll-mt-32">
          <h2 className="mb-4 text-xl font-bold font-[var(--font-space)]">Today&apos;s Market News</h2>
          <MarketNews />
        </section>
      </div>
    </div>
  );
}
