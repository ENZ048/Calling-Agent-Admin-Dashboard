"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { RadioTower, ArrowLeft, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { formatCredits, formatNumber, formatDuration } from "@/lib/utils";
import { fetchCampaignDetail, CampaignDetail } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const toast = useToast();

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchCampaignDetail(id);
        setCampaign(data);
      } catch (err) {
        console.error("Failed to fetch campaign:", err);
        setError("Failed to load campaign details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleExportCampaign = () => {
    if (!campaign) return;

    try {
      setExporting(true);

      const headers = [
        "id",
        "name",
        "description",
        "user",
        "status",
        "success_rate",
        "progress",
        "total_contacts",
        "total_calls",
        "completed_calls",
        "failed_calls",
        "reattempted_calls",
        "voicemail_calls",
        "queued_calls",
        "active_calls",
        "duration_seconds",
        "total_minutes",
        "total_credits",
        "phone_number",
        "created_at",
        "started_at",
        "completed_at",
        "scheduled_for",
      ];

      const phoneNumbers = campaign.phoneNumbers || [];
      const rows: string[][] = [];

      // Create a row for each phone number (or one row if no phone numbers)
      const phoneList = phoneNumbers.length > 0 ? phoneNumbers : [""];
      phoneList.forEach((phone) => {
        rows.push([
          campaign.id,
          campaign.name,
          campaign.description || "",
          campaign.userName,
          campaign.status,
          campaign.successRate.toFixed(1),
          campaign.progress.toString(),
          campaign.totalContacts.toString(),
          campaign.totalCalls.toString(),
          campaign.completedCalls.toString(),
          campaign.failedCalls.toString(),
          campaign.reattemptedCalls.toString(),
          campaign.voicemailCalls.toString(),
          campaign.queuedCalls.toString(),
          campaign.activeCalls.toString(),
          campaign.totalDurationSec.toString(),
          campaign.totalMinutes.toString(),
          campaign.totalCredits.toString(),
          phone,
          campaign.createdAt,
          campaign.startedAt || "",
          campaign.completedAt || "",
          campaign.scheduledFor || "",
        ]);
      });

      const csv =
        headers.join(",") +
        "\n" +
        rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      link.setAttribute("download", `campaign-${campaign.name.replace(/[^a-zA-Z0-9]/g, "-")}-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Campaign data exported successfully");
    } catch (err) {
      console.error("Failed to export:", err);
      toast.error("Failed to export campaign data");
    } finally {
      setExporting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-700";
      case "active":
      case "running":
        return "text-blue-700";
      case "paused":
        return "text-yellow-700";
      case "cancelled":
      case "failed":
        return "text-rose-700";
      case "scheduled":
        return "text-purple-700";
      case "draft":
      case "queued":
        return "text-zinc-600";
      default:
        return "text-zinc-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/campaigns"
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to campaigns
        </Link>
        <div className="glass-panel p-8 text-center">
          <p className="text-zinc-500">{error || "Campaign not found"}</p>
        </div>
      </div>
    );
  }

  const createdDate = new Date(campaign.createdAt).toLocaleDateString();

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard/campaigns"
        className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to campaigns
      </Link>

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <RadioTower className="h-3 w-3" />
            <span>Campaign detail</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {campaign.description || "No description"} · ID:{" "}
            <span className="font-mono text-xs">{campaign.id}</span>
          </p>
        </div>
        <button
          onClick={handleExportCampaign}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              Export Campaign Data
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass-panel p-4 space-y-1">
          <p className="text-xs text-zinc-500">Created by</p>
          <p className="text-sm font-semibold text-zinc-900">{campaign.userName}</p>
          <p className="text-xs text-zinc-500">Created on {createdDate}</p>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <p className="text-xs text-zinc-500">Status</p>
          <p className={`text-sm font-semibold capitalize ${getStatusStyle(campaign.status)}`}>
            {campaign.status}
          </p>
          <p className="text-xs text-zinc-500">
            Success rate: {campaign.successRate.toFixed(1)}%
          </p>
        </div>
        <div className="glass-panel p-4 space-y-1">
          <p className="text-xs text-zinc-500">Volume</p>
          <p className="text-sm font-semibold">
            {formatNumber(campaign.totalCalls)} calls
          </p>
          <p className="text-xs text-zinc-500">
            Duration: {formatDuration(campaign.totalDurationSec)}
          </p>
          <p className="text-xs text-zinc-500">
            Failed calls: {formatNumber(campaign.failedCalls)}
          </p>
          <p className="text-xs text-zinc-500">
            Reattempted calls: {formatNumber(campaign.reattemptedCalls)}
          </p>
        </div>
        <div className="glass-panel p-4 md:p-5 space-y-2">
          <p className="text-xs text-zinc-500">Credits</p>
          <p className="text-lg font-semibold text-emerald-600">
            {formatCredits(campaign.totalCredits)}
          </p>
          <p className="text-xs text-zinc-500">
            Estimated total credits used by this campaign.
          </p>
        </div>
      </div>
    </div>
  );
}
