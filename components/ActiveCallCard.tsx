"use client";

import { motion } from "framer-motion";
import { PhoneCall, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn, formatDuration } from "@/lib/utils";

type LiveCallMeta = {
  phone: string;
  userName: string;
  campaignName: string;
  agentName: string;
};

export function ActiveCallCard({
  index,
  campaignId = "cmp-001",
  meta,
}: {
  index: number;
  campaignId?: string;
  meta?: LiveCallMeta;
}) {
  const sentiment: ("positive" | "neutral" | "negative")[] = ["positive", "neutral", "positive", "negative"];
  const s = sentiment[index % sentiment.length];
  const router = useRouter();

  return (
    <motion.button
      type="button"
      onClick={() => router.push(`/dashboard/live/${campaignId}`)}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white px-3 py-3 shadow-sm shadow-slate-200/80 text-left w-full cursor-pointer hover:border-emerald-300 hover:shadow-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
            <User2 className="h-4 w-4 text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-900">
              {meta?.campaignName ?? `Demo campaign #${index + 1}`}
            </p>
            <p className="text-[11px] text-slate-500">
              {meta
                ? meta.userName
                : "Demo user"}
            </p>
          </div>
        </div>
        <span
            className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]",
            s === "positive" && "border-emerald-300 bg-emerald-50 text-emerald-700",
            s === "neutral" && "border-slate-200 bg-slate-50 text-slate-500",
            s === "negative" && "border-red-300 bg-red-50 text-red-600"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {s === "positive" ? "Engaged" : s === "neutral" ? "Neutral" : "At risk"}
        </span>
      </div>

      {/* waveform */}
      <div className="mt-3 flex items-end gap-0.5 h-10 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-0.5 rounded-full bg-gradient-to-t from-emerald-500/20 via-emerald-400/80 to-teal-400/90"
            animate={{
              height: [`${20 + (i % 8) * 4}%`, `${60 + (i % 6) * 6}%`, `${30 + (i % 7) * 5}%`],
            }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.03,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <PhoneCall className="h-3 w-3 text-emerald-500" />
          <span>00:{formatDuration(45 + index * 12).replace("m ", ":")}</span>
        </div>
        <span className="text-slate-500">
          Agent: {meta?.agentName ?? `Orbit-${index + 1}`}
        </span>
      </div>
    </motion.button>
  );
}


