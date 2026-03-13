"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Smartphone, Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck, AlertCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      // The backend route is the same as the auth service handles both signup (new user creation) and login via OTP
      const res = await fetch(`${apiBase}/api/v1/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone }),
      });

      const data = await res.json();
      if (res.ok) {
        setStep("otp");
      } else {
        setError(data.detail || "Verification failed. Check your connectivity.");
      }
    } catch (err) {
       setError("Identity service unreachable. Verify backend status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
      const res = await fetch(`${apiBase}/api/v1/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, otp }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      } else {
        setError(data.detail || "Security credentials rejected.");
      }
    } catch (err) {
      setError("Authorization timeout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "login" ? "signup" : "login");
    setError("");
    setStep("phone");
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-20 relative overflow-hidden bg-bg">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="bg-panel border border-border/50 rounded-3xl p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md relative overflow-hidden">
          <div className="mb-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center shadow-lg shadow-accent/20 mb-6 transition-transform hover:scale-110">
              {mode === "login" ? <ShieldCheck className="h-8 w-8 text-white" /> : <UserPlus className="h-8 w-8 text-white" />}
            </div>
            <h1 className="text-3xl font-extrabold font-[var(--font-space)] tracking-tight text-text text-center">
              {mode === "login" ? "Forensics Portal" : "Join Intelligence"}
            </h1>
            <p className="mt-2 text-muted text-sm font-medium text-center">
              {mode === "login" ? "Restricted Access Only" : "Create your analyst workspace"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.form 
                key="phone-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted/80 uppercase tracking-widest pl-1">
                    Mobile Identity
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted transition-colors group-focus-within:text-accent">
                      <Phone className="h-5 w-5" />
                    </span>
                    <Input
                      required
                      placeholder="+91 999 999 9999"
                      className="pl-12 py-7 bg-bg/50 border-border/40 focus:border-accent/50 focus:ring-accent/10 transition-all rounded-2xl"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-400/5 p-4 rounded-xl border border-red-400/20"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 shadow-xl shadow-accent/10 group transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === "login" ? "Request Access Link" : "Generate Member Link"}
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
                
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-xs font-bold text-muted hover:text-accent transition-colors"
                  >
                    {mode === "login" ? "New to Forensics? Register" : "Already registered? Sign in"}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="otp-step"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOTP} 
                className="space-y-8"
              >
                <div className="text-center">
                  <p className="text-sm font-semibold text-text">
                    Verifying Identity for
                  </p>
                  <p className="text-xs font-mono text-accent bg-accent/5 inline-block px-3 py-1 rounded-full mt-1">
                    {phone}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted/80 uppercase tracking-widest text-center block">
                    Security Key
                  </label>
                  <div className="flex justify-center">
                    <Input
                      autoFocus
                      required
                      maxLength={6}
                      placeholder="0   0   0   0   0   0"
                      className="text-center text-3xl font-bold font-mono py-8 bg-bg/50 border-border/40 focus:border-accent/50 focus:ring-accent/10 transition-all rounded-2xl tracking-[0.4em]"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-400/5 p-4 rounded-xl border border-red-400/20"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 shadow-xl shadow-accent/10 transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Verify and Access
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  
                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="w-full text-xs font-bold text-muted/60 hover:text-accent transition-colors"
                  >
                    Incorrect Number? Go Back
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center flex items-center justify-center gap-4 text-muted/30">
          <div className="h-px w-8 bg-border/30" />
          <span className="text-[10px] uppercase font-bold tracking-[0.3em]">SECURE PORTAL</span>
          <div className="h-px w-8 bg-border/30" />
        </div>
      </motion.div>
    </div>
  );
}
