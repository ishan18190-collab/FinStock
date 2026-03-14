"use client";

import { useState } from "react";
import { sendWhatsAppReport } from "@/lib/api";

export type Level = "beginner" | "intermediate" | "pro";

export function useWhatsAppReport(symbol: string) {
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const [sentStatus, setSentStatus] = useState<"idle" | "success" | "error">("idle");
  const [showLevelDialog, setShowLevelDialog] = useState(false);

  const handleSendWhatsApp = async (selectedLevel: Level) => {
    setSendingWhatsapp(true);
    setSentStatus("idle");
    
    // Get phone number from user object in localStorage
    const storedUser = localStorage.getItem("user");
    let phoneNumber = "";
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        phoneNumber = user.phone_number || user.phoneNumber; // Handle both cases
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
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setSentStatus("idle");
      }, 5000);
    } catch (error) {
      console.error("WhatsApp error", error);
      setSentStatus("error");
    } finally {
      setSendingWhatsapp(false);
    }
  };

  const openLevelDialog = () => {
    setSentStatus("idle");
    setShowLevelDialog(true);
  };

  const closeLevelDialog = () => {
    setShowLevelDialog(false);
  };

  return {
    sendingWhatsapp,
    sentStatus,
    showLevelDialog,
    handleSendWhatsApp,
    openLevelDialog,
    closeLevelDialog,
  };
}
