"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log("[LoginPage] Submitting login form...");

    try {
      const result = await login(email, password);
      console.log("[LoginPage] Login result:", result);
      if (result.success) {
        // Token is automatically stored by login function
        console.log("[LoginPage] Login successful, showing success toast...");
        setLoading(false);
        toast.alert({
          message: "Login successful! Welcome back.",
          type: "success",
          okText: "Continue",
          onOk: () => {
            router.push("/dashboard");
          },
        });
      } else {
        console.error("[LoginPage] Login failed - success=false");
        setLoading(false);
        toast.alert({
          message: "Login failed. Please check your credentials.",
          type: "error",
          okText: "OK",
        });
      }
    } catch (err: any) {
      console.error("[LoginPage] Login error:", err);
      setLoading(false);
      // Extract error message properly - handle various error formats
      let errorMessage = "Invalid email or password";
      if (typeof err === "string") {
        errorMessage = err;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err?.message && typeof err.message === "string") {
        errorMessage = err.message;
      } else if (err?.error && typeof err.error === "string") {
        errorMessage = err.error;
      }

      // Check if account is disabled/inactive
      const isAccountDisabled = errorMessage.toLowerCase().includes("inactive") ||
                                errorMessage.toLowerCase().includes("disabled");

      if (isAccountDisabled) {
        toast.alert({
          message: "Your account is disabled. Please contact the owner.",
          type: "warning",
          okText: "OK",
        });
      } else {
        toast.alert({
          message: errorMessage,
          type: "error",
          okText: "OK",
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-slate-100">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-400 to-sky-400 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.5),transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.4),transparent_55%)]" />
        <div className="relative z-10 max-w-md px-10 space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-1 text-xs backdrop-blur-md border border-white/20">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="uppercase tracking-[0.16em] text-emerald-50">
              Realtime Voice AI
            </span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight">
            Operate all your <span className="text-emerald-200">voice campaigns</span> from one
            beautiful control room.
          </h1>
          <p className="text-sm text-emerald-50/80">
            Monitor live calls, agents, and credits in realtime. This login is a demo gate - your
            backend auth can plug in later.
          </p>
        </div>
      </div>

      {/* Right auth card */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Voice AI Control
              </p>
              <p className="text-lg font-semibold text-zinc-900">Operations Dashboard</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/90 shadow-md shadow-zinc-200/80 p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-zinc-900">Sign in</h2>
              <p className="text-xs text-zinc-500">
                Use any email and password to enter the demo dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300 disabled:opacity-50"
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-600">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-10 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300 disabled:opacity-50"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-white shadow-sm shadow-emerald-300 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Continue to dashboard"
                )}
              </button>
            </form>

            <p className="text-[11px] text-zinc-400 text-center">
              Sign in with your admin account credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


