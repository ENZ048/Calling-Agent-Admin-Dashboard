"use client";

import { useState, useEffect } from "react";
import { PhoneCall, Loader2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion } from "framer-motion";
import { formatCredits, formatDuration } from "@/lib/utils";
import { fetchCallLogs, fetchCallLogDetail, CallLogListItem, CallLogDetail, CallLogsFilters, getRecordingPresignedUrl, getRecordingDownloadUrl } from "@/lib/api";
import { AudioPlayer } from "@/components/calls/AudioPlayer";
import { useToast } from "@/lib/toast";

const ITEMS_PER_PAGE = 50;

export default function CallsPage() {
  const toast = useToast();
  const [calls, setCalls] = useState<CallLogListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallLogDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [loadingRecordingUrl, setLoadingRecordingUrl] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pagination state from server
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Debounced search to avoid too many API calls
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch data when page or filters change
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const filters: CallLogsFilters = {
          search: debouncedSearch || undefined,
          campaignName: selectedCampaign,
          callType: typeFilter,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        };
        const result = await fetchCallLogs(currentPage, ITEMS_PER_PAGE, filters);
        setCalls(result.data);
        setTotalItems(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch call logs:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentPage, debouncedSearch, selectedCampaign, typeFilter, fromDate, toDate]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCampaign, typeFilter, fromDate, toDate]);

  const callTypes = ["Incoming", "Outgoing"];

  // Calculate display range
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const handleViewDetail = async (callId: string) => {
    try {
      setLoadingDetail(true);
      setRecordingUrl(null); // Reset recording URL for new call
      const detail = await fetchCallLogDetail(callId);
      setSelectedCall(detail);

      // Load recording URL if available (use S3 presigned URL, not raw Exotel URL)
      if (detail.recordingUrl) {
        loadRecordingUrl(callId);
      }
    } catch (error) {
      console.error("Failed to fetch call detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadRecordingUrl = async (callId: string) => {
    try {
      setLoadingRecordingUrl(true);
      // Always try to get S3 presigned URL first (backend will return S3 URL if available)
      try {
        const result = await getRecordingPresignedUrl(callId);
        // Double-check it's not an Exotel URL before setting
        if (result.url && result.url.includes('recordings.exotel.com')) {
          console.error("CRITICAL: Backend returned Exotel URL! This should not happen.");
          throw new Error("Backend returned Exotel URL instead of S3 URL");
        }
        setRecordingUrl(result.url);
      } catch (error: any) {
        console.warn('Failed to get S3 presigned URL, falling back to proxy:', error.message);
        // Fallback to proxy URL if S3 is not available
        // This endpoint downloads from Exotel and serves it (doesn't redirect to Exotel)
        const downloadUrl = getRecordingDownloadUrl(callId);
        setRecordingUrl(downloadUrl);
      }
    } catch (error: any) {
      console.error("Failed to load recording URL:", error);
      setRecordingUrl(null);
    } finally {
      setLoadingRecordingUrl(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!selectedCall || !selectedCall.transcript.length) return;

    const transcriptText = selectedCall.transcript
      .map((t) => `${t.speaker}: ${t.text}`)
      .join("\n");

    const blob = new Blob([transcriptText], {
      type: "text/plain;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${selectedCall.sessionId}-transcript.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = async () => {
    if (totalItems === 0) {
      toast.warning("No data to export");
      return;
    }

    try {
      setExporting(true);
      toast.info("Fetching all data for export...");

      // Fetch all data with current filters (use a large limit to get all at once)
      const filters: CallLogsFilters = {
        search: debouncedSearch || undefined,
        campaignName: selectedCampaign,
        callType: typeFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      };

      // Fetch all records - use totalItems as limit to get everything
      const result = await fetchCallLogs(1, Math.max(totalItems, 10000), filters);
      const allCalls = result.data;

      if (allCalls.length === 0) {
        toast.warning("No data to export");
        return;
      }

      const headers = [
        "id",
        "phone",
        "campaign",
        "type",
        "status",
        "duration_seconds",
        "credits",
        "created_at",
      ];

      const rows = allCalls.map((c) => [
        c.id,
        c.phone,
        c.campaignName,
        c.callType,
        c.outcome,
        c.durationSec.toString(),
        c.credits.toString(),
        c.createdAt,
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
      link.setAttribute("download", `calls-export-${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allCalls.length} call records`);
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
            <PhoneCall className="h-3 w-3" />
            <span>Call activity</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Call Logs</h1>
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
            Call Logs
          </span>
          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span>{totalItems} total · Showing {totalItems > 0 ? startIndex + 1 : 0}-{endIndex}</span>
          </div>
        </div>
        <div className="px-4 py-3 border-b border-zinc-100 flex flex-wrap items-center gap-3 bg-zinc-50/60">
          <input
            type="text"
            placeholder="Filter by number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full sm:w-56 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          />
          <input
            type="text"
            placeholder="Filter by campaign name"
            value={selectedCampaign === "all" ? "" : selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value || "all")}
            className="h-8 w-full sm:w-48 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 w-full sm:w-40 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
          >
            <option value="all">All types</option>
            {callTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="relative">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={`h-8 w-full sm:w-36 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${!fromDate ? "text-transparent" : ""}`}
              aria-label="From date"
            />
            {!fromDate && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">From</span>
            )}
          </div>
          <div className="relative">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className={`h-8 w-full sm:w-36 rounded-md border border-zinc-200 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${!toDate ? "text-transparent" : ""}`}
              aria-label="To date"
            />
            {!toDate && (
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none">To</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setSelectedCampaign("all");
              setTypeFilter("all");
              setFromDate("");
              setToDate("");
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
          <div className="overflow-x-auto text-sm max-h-[600px] overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="text-xs text-zinc-500 border-b border-zinc-100">
                  <th className="px-4 py-2 text-left font-medium">Number</th>
                  <th className="px-4 py-2 text-left font-medium">Campaign</th>
                  <th className="px-4 py-2 text-left font-medium">Call Type</th>
                  <th className="px-4 py-2 text-left font-medium">Status</th>
                  <th className="px-4 py-2 text-left font-medium">Duration</th>
                  <th className="px-4 py-2 text-left font-medium">Credits</th>
                  <th className="px-4 py-2 text-center font-medium w-24">Details</th>
                </tr>
              </thead>
              <tbody>
                {calls.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-zinc-500">
                      No call logs found
                    </td>
                  </tr>
                ) : (
                  calls.map((c, idx) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.01 }}
                      className="border-b border-zinc-100 last:border-0"
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(c.id)}
                          className="font-mono text-xs text-zinc-800 hover:text-emerald-600"
                        >
                          {c.phone}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-zinc-700">{c.campaignName}</td>
                      <td className="px-4 py-3 text-zinc-700">{c.callType}</td>
                      <td className="px-4 py-3 text-zinc-700">{c.outcome}</td>
                      <td className="px-4 py-3 text-zinc-700">
                        {formatDuration(c.durationSec)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-600">
                        {formatCredits(c.credits)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleViewDetail(c.id)}
                          className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50"
                        >
                          View
                        </button>
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

      {/* Call Detail Modal */}
      {(selectedCall || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              </div>
            ) : selectedCall && (
              <>
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 uppercase tracking-[0.16em]">
                      Call details
                    </p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {selectedCall.phone} · {selectedCall.campaignName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCall(null)}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-4 py-3 border-b border-zinc-100">
                  <div className="space-y-1">
                    <p className="text-[11px] text-zinc-500">Status</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {selectedCall.outcome}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-zinc-500">Duration</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {formatDuration(selectedCall.durationSec)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-zinc-500">Credits</p>
                    <p className="text-sm font-semibold text-emerald-600">
                      {formatCredits(selectedCall.credits)}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-semibold tracking-tight">Transcript</h2>
                    {selectedCall.transcript.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadTranscript}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100"
                      >
                        Download transcript
                      </button>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-zinc-700 max-h-48 overflow-y-auto">
                    {selectedCall.transcript.length > 0 ? (
                      selectedCall.transcript.map((t, idx) => (
                        <p key={idx}>
                          <span className="font-semibold text-zinc-900">{t.speaker}:</span> {t.text}
                        </p>
                      ))
                    ) : (
                      <p className="text-zinc-500 italic">No transcript available</p>
                    )}
                  </div>
                  {selectedCall.recordingUrl && (
                    <div className="mt-3">
                      {loadingRecordingUrl ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                          <span className="ml-2 text-xs text-zinc-500">Loading recording...</span>
                        </div>
                      ) : recordingUrl && !recordingUrl.includes('recordings.exotel.com') ? (
                        <AudioPlayer src={recordingUrl} />
                      ) : recordingUrl && recordingUrl.includes('recordings.exotel.com') ? (
                        <div className="py-4 text-center text-xs text-red-500">
                          Error: Cannot play Exotel URL directly. S3 upload may be pending.
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-zinc-500">
                          Failed to load recording URL
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
