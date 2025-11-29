"use client";

import { useEffect } from "react";
import { Waves, Loader2 } from "lucide-react";
import { ActiveCallCard } from "@/components/ActiveCallCard";
import { useCampaignsStore } from "@/lib/campaigns";

export default function LivePage() {
  const { liveCalls, loading, error, loadLiveCalls } = useCampaignsStore();

  // Fetch live calls on mount and set up auto-refresh
  useEffect(() => {
    // Load immediately on mount
    loadLiveCalls();
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      loadLiveCalls();
    }, 5000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
          <Waves className="h-3 w-3" />
          <span>Live Campaign</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Live Campaign</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Real-time view of all active calls across your campaigns. Updates automatically every 5 seconds.
        </p>
      </div>

      {loading && liveCalls.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : error ? (
        <div className="glass-panel px-4 py-8 text-center text-sm text-red-500">
          Error: {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {liveCalls.map((call, idx) => (
            <ActiveCallCard
              key={call.id}
              index={idx}
              campaignId={call.campaignId}
              meta={{
                phone: call.phone,
                userName: call.userName,
                campaignName: call.campaignName,
                agentName: call.agentName,
              }}
            />
          ))}
          {liveCalls.length === 0 && (
            <div className="col-span-full text-center text-xs text-zinc-400 py-8">
              No live calls right now. When a campaign is running, its calls will appear here.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

