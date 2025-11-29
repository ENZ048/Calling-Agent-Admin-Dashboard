"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard,
  PhoneCall,
  RadioTower,
  Users as UsersIcon,
  Activity,
  Waves,
  Menu,
  History,
  Globe2,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocketStore } from "@/lib/websocket";
import { useToast } from "@/lib/toast";

/**
 * Check if user is authenticated by verifying token exists
 */
function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");
  return !!token;
}

/**
 * Clear all auth tokens
 */
function clearAuth(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
}

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/campaigns", label: "Campaigns", icon: RadioTower },
  { href: "/dashboard/calls", label: "Calls", icon: PhoneCall },
  { href: "/dashboard/agents", label: "Agents", icon: UsersIcon },
  { href: "/dashboard/phones", label: "Phone Numbers", icon: PhoneCall },
  { href: "/dashboard/users", label: "Users", icon: UsersIcon },
  { href: "/dashboard/credits", label: "Credit History", icon: History },
  // { href: "/dashboard/crawler", label: "Crawler", icon: Globe2 },
  { href: "/dashboard/live", label: "Live Campaign", icon: Waves },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { status, connect } = useWebSocketStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, [router]);

  useEffect(() => {
    if (authChecked) {
      connect();
    }
  }, [connect, authChecked]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle logout
  const handleLogout = () => {
    setUserMenuOpen(false);
    toast.confirm({
      message: "Are you sure you want to logout?",
      confirmText: "Yes, Logout",
      cancelText: "No, Stay",
      onConfirm: () => {
        clearAuth();
        router.push("/login");
      },
    });
  };

  // Show nothing while checking auth (prevents flash)
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 via-slate-50 to-slate-100">
        <div className="flex items-center gap-2 text-zinc-500">
          <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-slate-100 text-zinc-900">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-zinc-900">Voice AI Control</div>
              <div className="text-xs text-zinc-500">Operations Dashboard</div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  "hover:bg-emerald-50 hover:text-emerald-700",
                  active && "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/20"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-center gap-2">
          <span
            className={cn(
              "inline-flex h-2 w-2 rounded-full",
              status === "connected" && "bg-emerald-400",
              status === "connecting" && "bg-yellow-400",
              status === "error" && "bg-red-400",
              status === "disconnected" && "bg-zinc-500"
            )}
          />
          <span className="text-zinc-400">Powered by Troika Tech</span>
        </div>
      </aside>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-zinc-200 bg-white/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-200">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden">
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="object-contain" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-zinc-900">Voice AI Control</div>
              <div className="text-xs text-zinc-500">Operations Dashboard</div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    "hover:bg-emerald-50 hover:text-emerald-700",
                    active && "bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/20"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="px-4 py-4 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-center gap-2">
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full",
                status === "connected" && "bg-emerald-400",
                status === "connecting" && "bg-yellow-400",
                status === "error" && "bg-red-400",
                status === "disconnected" && "bg-zinc-500"
              )}
            />
            <span className="text-zinc-400">Powered by Troika Tech</span>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 shadow-sm shadow-black/5">
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 transition-colors"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden">
                  <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
                </div>
                <span className="text-sm font-semibold text-zinc-900">Voice AI</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-zinc-500 uppercase tracking-[0.16em]">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Realtime Operations</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((open) => !open)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-xs text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  VA
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 bg-white shadow-lg shadow-black/5 py-2 text-xs z-50">
                    <div className="px-3 pb-2 border-b border-zinc-100">
                      <div className="font-medium text-zinc-800">Voice Agent Admin</div>
                      <div className="text-[11px] text-zinc-500">admin@voiceai.demo</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-3 pt-2 text-left text-zinc-600 hover:bg-zinc-50 flex items-center gap-2"
                    >
                      <LogOut className="h-3 w-3" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 px-3 md:px-6 py-4 md:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}


