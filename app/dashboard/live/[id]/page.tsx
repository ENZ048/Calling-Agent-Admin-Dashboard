"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  RadioTower,
  ArrowLeft,
  Loader2,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  RefreshCw,
  Pause,
  Play,
} from "lucide-react";
import { formatNumber, formatDuration } from "@/lib/utils";
import { fetchCampaignDetail, fetchLiveCalls, CampaignDetail, LiveCallResponse } from "@/lib/api";

export default function LiveCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [liveCalls, setLiveCalls] = useState<LiveCallResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Load campaign data and live calls
  const loadData = async () => {
    try {
      const [campaignData, liveCallsData] = await Promise.all([
        fetchCampaignDetail(id),
        fetchLiveCalls(),
      ]);

      setCampaign(campaignData);
      // Filter live calls for this campaign
      const campaignLiveCalls = liveCallsData.data.filter(
        (call) => call.campaignId === id
      );
      setLiveCalls(campaignLiveCalls);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error("Failed to load campaign data:", err);
      setError(err.message || "Failed to load campaign data");
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh every 5 seconds
  useEffect(() => {
    if (!id) return;

    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "running":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "completed":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "paused":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "failed":
      case "cancelled":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-zinc-600 bg-zinc-50 border-zinc-200";
    }
  };

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/live"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to live campaigns
        </Link>
        <div className="glass-panel px-4 py-8 text-center text-sm text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/live"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to live campaigns
        </Link>
        <div className="glass-panel px-4 py-8 text-center text-sm text-zinc-500">
          Campaign not found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard/live"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to live campaigns
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-zinc-400">
            {lastUpdated && `Updated ${lastUpdated.toLocaleTimeString()}`}
          </span>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Campaign Info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <RadioTower className="h-3 w-3" />
            <span>Live Campaign Status</span>
            {liveCalls.length > 0 && (
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {campaign.description || "No description"} · Created by {campaign.userName}
          </p>
          <p className="text-xs text-zinc-400 mt-1 font-mono">ID: {id}</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium capitalize ${getStatusColor(
            campaign.status
          )}`}
        >
          {campaign.status === "active" || campaign.status === "queued" ? (
            <Play className="h-4 w-4" />
          ) : campaign.status === "paused" ? (
            <Pause className="h-4 w-4" />
          ) : campaign.status === "completed" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {campaign.status}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Phone className="h-3 w-3" />
            Total Contacts
          </div>
          <p className="text-xl font-semibold">{formatNumber(campaign.totalContacts)}</p>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Completed
          </div>
          <p className="text-xl font-semibold text-emerald-600">
            {formatNumber(campaign.completedCalls)}
          </p>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <XCircle className="h-3 w-3 text-red-500" />
            Failed
          </div>
          <p className="text-xl font-semibold text-red-600">
            {formatNumber(campaign.failedCalls)}
          </p>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <RadioTower className="h-3 w-3 text-blue-500" />
            Active Now
          </div>
          <p className="text-xl font-semibold text-blue-600">
            {formatNumber(liveCalls.length)}
          </p>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Users className="h-3 w-3" />
            In Queue
          </div>
          <p className="text-xl font-semibold">
            {formatNumber(campaign.queuedCalls || 0)}
          </p>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Clock className="h-3 w-3" />
            Duration
          </div>
          <p className="text-xl font-semibold">
            {formatDuration(campaign.totalDurationSec || 0)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 font-medium">Campaign Progress</span>
          <span className="text-zinc-900 font-semibold">{campaign.progress}%</span>
        </div>
        <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>
            {formatNumber(campaign.completedCalls + campaign.failedCalls)} processed
          </span>
          <span>{campaign.successRate}% success rate</span>
          <span>{formatNumber(campaign.totalContacts)} total</span>
        </div>
      </div>

      {/* Live Calls Section */}
      <div className="glass-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioTower className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-semibold">Active Calls</h2>
            {liveCalls.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {liveCalls.length} live
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-400">Auto-refreshing every 5s</span>
        </div>

        {liveCalls.length > 0 ? (
          <div className="divide-y divide-zinc-100">
            {liveCalls.map((call) => (
              <div
                key={call.id}
                className="px-4 py-3 flex items-center justify-between hover:bg-zinc-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                    <Phone className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{call.phone}</p>
                    <p className="text-xs text-zinc-500">Agent: {call.agentName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Duration</p>
                    <p className="text-sm font-medium">{formatDuration(call.durationSec)}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    In Progress
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-center text-sm text-zinc-500">
            <RadioTower className="h-8 w-8 mx-auto mb-2 text-zinc-300" />
            <p>No active calls right now</p>
            <p className="text-xs text-zinc-400 mt-1">
              Calls will appear here when the campaign is running
            </p>
          </div>
        )}
      </div>

      {/* Campaign Settings */}
      {campaign.settings && (
        <div className="glass-panel p-4 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Campaign Settings</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-zinc-500">Concurrent Calls</p>
              <p className="font-medium">{campaign.settings.concurrentCallsLimit || "Default"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Retry Failed</p>
              <p className="font-medium">{campaign.settings.retryFailedCalls ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-zinc-500">Max Retries</p>
              <p className="font-medium">{campaign.settings.maxRetryAttempts || 0}</p>
            </div>
            <div>
              <p className="text-zinc-500">Retry Delay</p>
              <p className="font-medium">{campaign.settings.retryDelayMinutes || 0} min</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
