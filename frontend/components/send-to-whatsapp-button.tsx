"use client";

import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWhatsAppReport } from "@/hooks/use-whatsapp-report";
import { ExpertiseLevelModal } from "./sections/expertise-level-modal";

interface SendToWhatsAppButtonProps {
  symbol: string;
  className?: string;
}

export function SendToWhatsAppButton({ symbol, className }: SendToWhatsAppButtonProps) {
  const {
    sendingWhatsapp,
    sentStatus,
    showLevelDialog,
    handleSendWhatsApp,
    openLevelDialog,
    closeLevelDialog
  } = useWhatsAppReport(symbol);

  if (sentStatus === "success") {
    return (
      <div className={`flex items-center gap-2 text-success text-sm font-semibold rounded-lg bg-success/10 p-2 justify-center ${className ?? ""}`}>
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Report sent to WhatsApp!
      </div>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className={`w-full gap-2 border-green-500/30 bg-green-500/20 text-green-600 hover:bg-green-500/30 hover:border-green-500/50 dark:text-green-400 dark:bg-green-500/20 dark:hover:bg-green-500/30 ${className ?? ""}`}
        onClick={openLevelDialog}
        disabled={sendingWhatsapp}
      >
        {sendingWhatsapp ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <Send className="h-4 w-4 shrink-0" />
        )}
        {sendingWhatsapp ? "Generating & sending..." : "Get PDF Report on WhatsApp"}
      </Button>

      <ExpertiseLevelModal 
        isOpen={showLevelDialog} 
        onClose={closeLevelDialog} 
        onSelect={handleSendWhatsApp} 
      />
    </>
  );
}
