"use client";

import { useState } from "react";
import { Sparkles, MessageSquare, CheckCircle2, Loader2, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateStockSummary, sendWhatsAppReport } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type Level = "beginner" | "intermediate" | "pro";

interface AISummarySectionProps {
  symbol: string;
}

export function AISummarySection({ symbol }: AISummarySectionProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("intermediate");
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [sentStatus, setSentStatus] = useState<"idle" | "success" | "error">("idle");

  const handleGenerateSummary = async () => {
    setLoading(true);
    setSentStatus("idle");
    const result = await generateStockSummary(symbol, level);
    setSummary(result.summary);
    setLoading(false);
  };

  const handleSendWhatsApp = async (selectedLevel: Level) => {
    setSendingWhatsapp(true);
    setSentStatus("idle");
    
    // Get phone number from user object in localStorage
    const storedUser = localStorage.getItem("user");
    let phoneNumber = "";
    if (storedUser) {
      try {
        phoneNumber = JSON.parse(storedUser).phone_number;
      } catch (e) {
        console.error("Failed to parse user for WhatsApp", e);
      }
    }

    if (!phoneNumber) {
      alert("Please login with a phone number to receive reports on WhatsApp.");
      setSendingWhatsapp(false);
      return;
    }

    try {
      await sendWhatsAppReport(symbol, phoneNumber, selectedLevel);
      setSentStatus("success");
      setShowLevelDialog(false);
    } catch (error) {
      console.error("WhatsApp error", error);
      setSentStatus("error");
    } finally {
      setSendingWhatsapp(false);
    }
  };

  return (
    <Card className="overflow-hidden border-accent/20 bg-panel/40 backdrop-blur-md">
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
                  onClick={() => setShowLevelDialog(true)}
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

      {/* Level Selection Modal */}
      <AnimatePresence>
        {showLevelDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
              onClick={() => setShowLevelDialog(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-2xl"
            >
              <h3 className="font-[var(--font-space)] text-2xl font-bold">Choose your expertise</h3>
              <p className="mt-2 text-sm text-muted">We will tailor the PDF research report specifically to your market experience.</p>
              
              <div className="mt-8 space-y-3">
                {[
                  { id: "beginner", title: "Beginner", desc: "Simple terms, focused on basic pros & cons." },
                  { id: "intermediate", title: "Intermediate", desc: "Standard ratios, growth trends and peer analysis." },
                  { id: "pro", title: "Pro Analyst", desc: "Technical indicators, cash flows and margin analysis." }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleSendWhatsApp(l.id as Level)}
                    className="flex w-full items-center gap-4 rounded-2xl border border-border bg-bg/50 p-4 text-left transition-all hover:border-accent hover:bg-accent/5 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card border border-border group-hover:bg-accent group-hover:text-white transition-colors">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold">{l.title}</p>
                      <p className="text-xs text-muted">{l.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                className="mt-6 w-full text-muted hover:text-foreground"
                onClick={() => setShowLevelDialog(false)}
              >
                Cancel
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Card>
  );
}
