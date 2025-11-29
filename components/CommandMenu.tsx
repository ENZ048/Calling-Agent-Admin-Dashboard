"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, RadioTower, PhoneCall, LayoutDashboard, Users, Waves, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/toast";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const toast = useToast();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  const navigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full max-w-md items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500 shadow-sm shadow-slate-200 hover:border-zinc-300 hover:bg-zinc-50"
      >
        <Search className="h-3.5 w-3.5 text-zinc-400" />
        <span className="truncate">Search campaigns, calls, agents…</span>
        <span className="ml-auto rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-500">
          ⌘K
        </span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-24">
          <Command
            className={cn(
              "w-full max-w-xl rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl shadow-black/10",
              "backdrop-blur-2xl"
            )}
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <Command.Input
                placeholder="Jump to anything…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
              />
            </div>
            <Command.List className="max-h-72 overflow-y-auto py-1 text-sm">
              <Command.Empty className="px-3 py-2 text-xs text-zinc-500">
                No results. Try a different keyword.
              </Command.Empty>
              <Command.Group heading="Navigation" className="px-2 py-1 text-[11px] text-zinc-500">
                <Command.Item
                  onSelect={() => navigate("/dashboard")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs data-[selected=true]:bg-zinc-100"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
                  Overview
                </Command.Item>
                <Command.Item
                  onSelect={() => navigate("/dashboard/campaigns")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs data-[selected=true]:bg-zinc-100"
                >
                  <RadioTower className="h-3.5 w-3.5 text-emerald-400" />
                  Campaigns
                </Command.Item>
                <Command.Item
                  onSelect={() => navigate("/dashboard/calls")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs data-[selected=true]:bg-zinc-100"
                >
                  <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                  Calls
                </Command.Item>
                <Command.Item
                  onSelect={() => navigate("/dashboard/agents")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs data-[selected=true]:bg-zinc-100"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  Agents
                </Command.Item>
                <Command.Item
                  onSelect={() => navigate("/dashboard/users")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs data-[selected=true]:bg-zinc-100"
                >
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  Users
                </Command.Item>
                <Command.Item
                  onSelect={() => navigate("/dashboard/live")}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs data-[selected=true]:bg-zinc-100"
                >
                  <Waves className="h-3.5 w-3.5 text-emerald-400" />
                  Live Campaign
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Actions" className="px-2 py-1 text-[11px] text-zinc-500">
                <Command.Item
                  onSelect={() => {
                    setOpen(false);
                    // TODO: wire to real /admin pause endpoint
                    toast.info("Would pause all campaigns via backend API");
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs data-[selected=true]:bg-zinc-100"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-red-400" />
                  Pause all campaigns
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </div>
      )}
    </>
  );
}


