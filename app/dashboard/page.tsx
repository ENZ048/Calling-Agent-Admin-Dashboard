"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock3, PhoneCall, TrendingUp, Waves, Sparkles, ShieldCheck, DatabaseZap, RadioTower, Users, CheckCircle2, XCircle, Pause, PlayCircle, User } from "lucide-react";
import { fetchDashboardOverview, fetchSystemStatus, fetchRecentCampaigns, DashboardOverviewResponse, SystemStatusResponse, RecentCampaign } from "@/lib/api";
import { formatCredits, formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import { KPICard } from "@/components/KPICard";

export default function DashboardOverviewPage() {
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [system, setSystem] = useState<SystemStatusResponse | null>(null);
  const [campaigns, setCampaigns] = useState<RecentCampaign[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [ov, sys, camps] = await Promise.all([
          fetchDashboardOverview().catch(() => null),
          fetchSystemStatus().catch(() => null),
          fetchRecentCampaigns(6).catch(() => []),
        ]);
        if (!mounted) return;
        if (ov) setOverview(ov);
        if (sys) setSystem(sys);
        if (camps) setCampaigns(camps);
        setLastUpdated(new Date());
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 15_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    // Client-side clock to avoid SSR/CSR mismatch
    const update = () => setClock(new Date().toLocaleTimeString());
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const kpiSkeleton = (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="glass-panel kpi-gradient relative overflow-hidden animate-pulse"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900/60 via-zinc-900/40 to-zinc-900/20" />
          <div className="relative p-4 h-28" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 mb-3">
            <Sparkles className="h-3 w-3" />
            <span>Live Voice AI Operations</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Realtime Overview</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Monitor calls, agents, and system health in one glassy control surface.
          </p>
        </div>
        {/* <div className="flex items-center gap-3 text-xs text-zinc-500">
          <Clock3 className="h-4 w-4 text-zinc-400" />
          <span suppressHydrationWarning>
            Last updated: {lastUpdated ? timeAgo(lastUpdated) : "syncing..."}
          </span>
        </div> */}
      </div>

      {/* KPI grid */}
      {loading && !overview ? (
        kpiSkeleton
      ) : overview ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <KPICard
            icon={PhoneCall}
            label="Total Calls"
            value={formatNumber(overview.overview.totalCalls)}


          />
          <KPICard
            icon={TrendingUp}
            label="Success Call Rate"
            value={`${overview.overview.successRate.toFixed(1)}%`}
            accent="emerald"
          />
          <KPICard
            icon={Activity}
            label="Active Calls"
            value={formatNumber(overview.overview.inProgressCalls)}
          />
          <KPICard
            icon={Clock3}
            label="Avg Duration"
            value={formatDuration(overview.overview.averageDuration)}
          />
          <KPICard
            icon={Waves}
            label="Calls per Hour"
            value={formatNumber(overview.overview.callsPerHour ?? 0)}
          />
          <KPICard
            icon={ShieldCheck}
            label="Campaign Created"
            value={formatNumber(overview.campaigns?.totalCreated ?? 0)}
            accent="emerald"
          />
          <KPICard
            icon={DatabaseZap}
            label="Credits Used"
            value={formatCredits(overview.cost.estimatedCosts.total ?? 0)}
          />
          <KPICard
            icon={RadioTowerIcon}
            label="Active Campaigns"
            value={formatNumber(system?.campaigns.active ?? 0)}
          />
        </motion.div>
      ) : null}

      {/* Lower grid: recent campaigns + system health */}
      <div className="grid grid-cols-1 gap-4">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          className="glass-panel relative overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(45,212,191,0.1),transparent_55%)]" />
          <div className="relative p-4 md:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold tracking-tight">Recent Campaigns</h2>
              </div>
              <span className="text-xs text-zinc-500">
                {campaigns.length > 0 ? `${campaigns.length} campaigns` : "No campaigns yet"}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {campaigns.length > 0 ? (
                campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))
              ) : (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8 text-zinc-500 text-sm">
                  No campaigns found
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
          className="glass-panel p-4 md:p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold tracking-tight">System Health</h2>
          </div>
          <div className="space-y-3 text-xs">
            <HealthRow
              label="Redis"
              status={system?.redis.isConnected ? "Healthy" : "Degraded"}
            />
            <HealthRow
              label="Queue"
              status={
                system && system.queue.failed > 0
                  ? "Issues"
                  : system && system.queue.active > 0
                  ? "Processing"
                  : "Idle"
              }
            />
            <HealthRow
              label="Active campaigns"
              status={`${system?.campaigns.active ?? 0} running`}
            />
          </div>
          <div className="text-[11px] text-zinc-500 border-t border-zinc-200 pt-3 flex justify-between">
            <span>Backend: http://localhost:8000</span>
            <span suppressHydrationWarning>{clock ?? "--:--:--"}</span>
          </div>
        </motion.section> */}
      </div>
    </div>
  );
}

function HealthRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400">{label}</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 px-2 py-0.5 text-[11px] text-zinc-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {status}
      </span>
    </div>
  );
}

function RadioTowerIcon(props: React.ComponentProps<"svg">) {
  return <RadioTower {...props} />;
}

function CampaignCard({ campaign }: { campaign: RecentCampaign }) {
  const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    active: { color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <PlayCircle className="h-3 w-3" /> },
    completed: { color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30", icon: <CheckCircle2 className="h-3 w-3" /> },
    paused: { color: "text-yellow-500", bg: "bg-yellow-500/10 border-yellow-500/30", icon: <Pause className="h-3 w-3" /> },
    failed: { color: "text-red-500", bg: "bg-red-500/10 border-red-500/30", icon: <XCircle className="h-3 w-3" /> },
    cancelled: { color: "text-zinc-500", bg: "bg-zinc-500/10 border-zinc-500/30", icon: <XCircle className="h-3 w-3" /> },
    draft: { color: "text-zinc-400", bg: "bg-zinc-400/10 border-zinc-400/30", icon: null },
    scheduled: { color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/30", icon: <Clock3 className="h-3 w-3" /> },
    queued: { color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/30", icon: <Users className="h-3 w-3" /> },
  };

  const config = statusConfig[campaign.status] || statusConfig.draft;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-zinc-900 truncate">{campaign.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
            <User className="h-3 w-3" />
            {campaign.userName}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${config.bg} ${config.color}`}>
          {config.icon}
          {campaign.status}
        </span>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-zinc-500">
          <span>Progress</span>
          <span>{campaign.progress}%</span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3 text-zinc-400" />
          {campaign.totalContacts} contacts
        </span>
        <span>{campaign.successRate}% success</span>
      </div>
    </div>
  );
}


