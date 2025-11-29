"use client";

import { motion } from "framer-motion";
import type { SVGProps, ComponentType } from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string | number;
  trendLabel?: string;
  trendValue?: number;
  accent?: "emerald" | "blue";
}

export function KPICard({ icon: Icon, label, value, trendLabel, trendValue, accent = "blue" }: KPICardProps) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-zinc-200 bg-white",
        "shadow-[0_18px_35px_rgba(15,23,42,0.08)] kpi-gradient"
      )}
    >
      <div className="relative p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">
              {label}
            </p>
            <div className="text-xl font-semibold tabular-nums text-zinc-900">{value}</div>
          </div>
          <div
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white",
              accent === "emerald" &&
                "border-emerald-200 bg-gradient-to-br from-emerald-100 to-teal-100"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 text-zinc-500",
                accent === "emerald" && "text-emerald-500"
              )}
            />
          </div>
        </div>
        {typeof trendValue === "number" && trendLabel && (
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>{trendLabel}</span>
            <span className="text-emerald-500 font-medium">+{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}


