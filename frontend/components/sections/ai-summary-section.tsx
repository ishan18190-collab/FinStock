"use client";

import { useState } from "react";
import { Sparkles, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateStockSummary } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useWhatsAppReport, Level } from "@/hooks/use-whatsapp-report";
import { ExpertiseLevelModal } from "./expertise-level-modal";

interface AISummarySectionProps {
  symbol: string;
}

export function AISummarySection({ symbol }: AISummarySectionProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("intermediate");
  
  const {
    sendingWhatsapp,
    sentStatus,
    showLevelDialog,
    handleSendWhatsApp,
    openLevelDialog,
    closeLevelDialog
  } = useWhatsAppReport(symbol);

  const handleGenerateSummary = async () => {
    setLoading(true);
    const result = await generateStockSummary(symbol, level);
    setSummary(result.summary);
    setLoading(false);
  };

  return (
    <Card className="overflow-hidden border-accent/20 bg-panel/70 backdrop-blur-md">
      <div className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-[var(--font-space)] text-lg font-bold">AI Intelligence Summary</h3>
              <p className="text-xs text-muted">Gemini-powered personalized research</p>
            </div>
          </div>
          
          <div className="flex gap-2">
             <select 
               value={level} 
               onChange={(e) => setLevel(e.target.value as Level)}
               className="h-9 rounded-lg border border-border bg-bg px-3 text-xs font-semibold outline-none focus:border-accent"
             >
               <option value="beginner">Beginner</option>
               <option value="intermediate">Intermediate</option>
               <option value="pro">Pro Analyst</option>
             </select>
             
             <Button 
               size="sm" 
               className="gap-2" 
               onClick={handleGenerateSummary}
               disabled={loading}
             >
               {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
               Analyze
             </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {summary ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 space-y-4"
            >
              <div className="rounded-2xl border border-border bg-bg/50 p-4">
                <p className="text-sm leading-relaxed text-text/90 whitespace-pre-wrap">{summary}</p>
              </div>
              
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <Button 
                  variant="secondary" 
                  className="gap-2 border-primary/20 text-primary hover:bg-primary/10"
                  onClick={openLevelDialog}
                  disabled={sendingWhatsapp}
                >
                  {sendingWhatsapp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Send PDF Report to WhatsApp
                </Button>
                
                {sentStatus === "success" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-success animate-in fade-in slide-in-from-right-4">
                    <CheckCircle2 className="h-4 w-4" />
                    REPORT SENT TO WHATSAPP
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-accent/5 p-4">
                <Sparkles className="h-8 w-8 text-accent/20" />
              </div>
              <p className="mt-4 text-sm font-medium text-muted">Select your expertise level and click analyze to generate a tailored stock summary.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <ExpertiseLevelModal 
        isOpen={showLevelDialog} 
        onClose={closeLevelDialog} 
        onSelect={handleSendWhatsApp} 
      />
    </Card>
  );
}
