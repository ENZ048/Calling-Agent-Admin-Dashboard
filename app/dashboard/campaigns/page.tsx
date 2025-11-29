"use client";

import { useState, useEffect } from "react";
import { RadioTower, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { formatCredits, formatNumber, formatDuration } from "@/lib/utils";
import { fetchCampaignsList, CampaignListItem, CampaignsListFilters } from "@/lib/api";
import { useToast } from "@/lib/toast";

const ITEMS_PER_PAGE = 10;

export default function CampaignsPage() {
  const toast = useToast();
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  // Pagination state from server
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search
  const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
  const [debouncedUserFilter, setDebouncedUserFilter] = useState("all");

  // Debounce name filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNameFilter(nameFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  // Debounce user filter
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserFilter(userFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [userFilter]);

  // Fetch data when page or filters change
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const filters: CampaignsListFilters = {
          name: debouncedNameFilter || undefined,
          userName: debouncedUserFilter,
          date: dateFilter || undefined,
          status: "completed,cancelled", // Only show completed or cancelled
        };
        const result = await fetchCampaignsList(currentPage, ITEMS_PER_PAGE, filters);
        setCampaigns(result.data);
        setTotalItems(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch campaigns:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage, debouncedNameFilter, debouncedUserFilter, dateFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedNameFilter, debouncedUserFilter, dateFilter]);

  // Calculate display range
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-700";
      case "active":
      case "running":
        return "bg-blue-50 text-blue-700";
      case "paused":
        return "bg-yellow-50 text-yellow-700";
      case "cancelled":
      case "failed":
        return "bg-rose-50 text-rose-700";
      case "scheduled":
        return "bg-purple-50 text-purple-700";
      case "draft":
        return "bg-zinc-100 text-zinc-600";
      default:
        return "bg-zinc-100 text-zinc-600";
    }
  };

  const handleExportCsv = async () => {
    if (totalItems === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      setExporting(true);
      toast.info("Fetching all data for export...");

      // Fetch all data with current filters
      const filters: CampaignsListFilters = {
        name: debouncedNameFilter || undefined,
        userName: debouncedUserFilter,
        date: dateFilter || undefined,
        status: "completed,cancelled",
      };

      // Fetch all records
      const result = await fetchCampaignsList(1, Math.max(totalItems, 10000), filters);
      const allCampaigns = result.data;

      if (allCampaigns.length === 0) {
        toast.warning("No data to export");
        return;
      }

      const headers = [
        "id",
        "name",
        "user",
        "success_rate",
        "total_calls",
        "duration_seconds",
        "total_credits",
        "status",
        "phone_numbers",
      ];

      const rows = allCampaigns.map((c) => [
        c.id,
        c.name,
        c.userName,
        c.successRate.toFixed(1),
        c.totalCalls.toString(),
        c.totalDurationSec.toString(),
        c.totalCredits.toString(),
        c.status,
        (c.phoneNumbers || []).join("; "), // Join phone numbers with semicolon for CSV
      ]);

      const csv =
        headers.join(",") +
        "\n" +
        rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute("download", `campaigns-export-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allCampaigns.length} campaigns`);
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <RadioTower className="h-3 w-3" />
            <span>Campaign orchestration</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="text-sm text-zinc-500 mt-1">
            View all outbound campaigns with real-time data.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting || totalItems === 0}
          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              Export
            </>
          )}
        </button>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-[0.16em]">
            All Campaigns
          </span>
          <span className="text-xs text-zinc-400">
            {totalItems} total · Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex}
          </span>
        </div>
        <div className="px-4 py-3 border-b border-zinc-100 flex flex-wrap items-center gap-3 bg-zinc-50/60">
          <input
            type="text"
            placeholder="Filter by campaign name or ID"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="h-8 w-full sm:w-52 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          />
          <input
            type="text"
            placeholder="Filter by user name"
            value={userFilter === "all" ? "" : userFilter}
            onChange={(e) => setUserFilter(e.target.value || "all")}
            className="h-8 w-full sm:w-40 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-8 w-full sm:w-40 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          />
          <button
            type="button"
            onClick={() => {
              setNameFilter("");
              setUserFilter("all");
              setDateFilter("");
            }}
            className="ml-auto h-8 rounded-full border border-zinc-200 px-3 text-[11px] text-zinc-600 hover:bg-zinc-50"
          >
            Clear filters
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="px-4 py-2 text-left font-medium">Campaign</th>
                  <th className="px-4 py-2 text-left font-medium">User</th>
                  <th className="px-4 py-2 text-left font-medium">Success</th>
                  <th className="px-4 py-2 text-left font-medium">Calls</th>
                  <th className="px-4 py-2 text-left font-medium">Duration</th>
                  <th className="px-4 py-2 text-left font-medium">Total Credits</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-center font-medium w-20">Details</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                      No campaigns found
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/campaigns/${c.id}`}
                          className="font-medium text-zinc-900 hover:text-emerald-600"
                        >
                          {c.name}
                        </Link>
                        <div className="text-xs text-zinc-500 truncate max-w-[200px]">{c.id}</div>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{c.userName}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {c.successRate.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {formatNumber(c.totalCalls)}
                      </td>
                      <td className="px-4 py-3 text-zinc-700">
                        {formatDuration(c.totalDurationSec)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {formatCredits(c.totalCredits)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${getStatusStyle(c.status)}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/dashboard/campaigns/${c.id}`}
                          className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50"
                        >
                          View
                        </Link>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 py-3 border-t border-zinc-100 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`inline-flex items-center justify-center h-8 w-8 rounded-md text-xs font-medium ${
                      currentPage === pageNum
                        ? "bg-emerald-600 text-white"
                        : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
