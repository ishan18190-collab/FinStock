"use client";

import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Level } from "@/hooks/use-whatsapp-report";

interface ExpertiseLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (level: Level) => void;
}

const levels = [
  { id: "beginner", title: "Beginner", desc: "Simple terms, focused on basic pros & cons." },
  { id: "intermediate", title: "Intermediate", desc: "Standard ratios, growth trends and peer analysis." },
  { id: "pro", title: "Pro Analyst", desc: "Technical indicators, cash flows and margin analysis." }
] as const;

export function ExpertiseLevelModal({ isOpen, onClose, onSelect }: ExpertiseLevelModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
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
              {levels.map((l) => (
                <button
                  key={l.id}
                  onClick={() => onSelect(l.id as Level)}
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
              onClick={onClose}
            >
              Cancel
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
