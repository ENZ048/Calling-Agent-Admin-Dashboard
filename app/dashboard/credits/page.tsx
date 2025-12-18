"use client";

import { useEffect, useState } from "react";
import { useCreditHistoryStore, CreditHistoryItem } from "@/lib/credit-history";
import { History, ChevronLeft, ChevronRight, Download, X, Search } from "lucide-react";
import { useToast } from "@/lib/toast";

const ITEMS_PER_PAGE = 10;

type ExportMode = "all" | "name" | "email";

export default function CreditHistoryPage() {
  const toast = useToast();
  const { items, loading, error, loadCreditHistory } = useCreditHistoryStore();
  const [currentPage, setCurrentPage] = useState(1);
  
  // Table filter state
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("all");
  const [exportNameFilter, setExportNameFilter] = useState("");
  const [exportEmailFilter, setExportEmailFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  // Fetch credit history on mount
  useEffect(() => {
    loadCreditHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, emailFilter]);

  // Filter items for table display
  const filteredItems = items.filter((item) => {
    const matchesName = nameFilter === "" || item.name.toLowerCase().includes(nameFilter.toLowerCase());
    const matchesEmail = emailFilter === "" || item.email.toLowerCase().includes(emailFilter.toLowerCase());
    return matchesName && matchesEmail;
  });

  // Pagination calculations (on filtered items)
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Get filtered items based on export mode
  const getExportItems = (): CreditHistoryItem[] => {
    if (exportMode === "all") {
      return items;
    } else if (exportMode === "name" && exportNameFilter.trim()) {
      return items.filter((item) =>
        item.name.toLowerCase().includes(exportNameFilter.toLowerCase())
      );
    } else if (exportMode === "email" && exportEmailFilter.trim()) {
      return items.filter((item) =>
        item.email.toLowerCase().includes(exportEmailFilter.toLowerCase())
      );
    }
    return items;
  };

  const exportItems = getExportItems();

  // Reset modal state when opening
  const handleOpenExportModal = () => {
    setExportMode("all");
    setExportNameFilter("");
    setExportEmailFilter("");
    setShowExportModal(true);
  };

  // Export to CSV function
  const handleExportCSV = () => {
    const itemsToExport = getExportItems();
    
    if (itemsToExport.length === 0) {
      toast.warning("No data to export");
      return;
    }

    setExporting(true);
    try {
      const headers = ["#", "Name", "Email", "Type", "Amount", "Description", "When"];
      const rows = itemsToExport.map((item, idx) => [
        idx + 1,
        item.name,
        item.email,
        item.type === "add" ? "Credit" : "Debit",
        `${item.type === "add" ? "+" : "-"}${item.amount} credits`,
        item.description || "Super Admin",
        new Date(item.createdAt).toLocaleString(),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      let fileSuffix = "";
      if (exportMode === "name" && exportNameFilter.trim()) {
        fileSuffix = `_name_${exportNameFilter.trim().replace(/\s+/g, "_")}`;
      } else if (exportMode === "email" && exportEmailFilter.trim()) {
        fileSuffix = `_email_${exportEmailFilter.trim().replace(/[@.]/g, "_")}`;
      }
      link.download = `credit_history_${timestamp}${fileSuffix}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${itemsToExport.length} records to CSV`);
      setShowExportModal(false);
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  // Check if export button should be disabled
  const isExportDisabled = () => {
    if (exporting) return true;
    if (exportMode === "name" && !exportNameFilter.trim()) return true;
    if (exportMode === "email" && !exportEmailFilter.trim()) return true;
    return exportItems.length === 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <History className="h-3 w-3" />
            <span>Credit History</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Credit History</h1>
          <p className="text-sm text-zinc-500 mt-1">
            See every time credits were added or removed for your users.
          </p>
        </div>
        <button
          onClick={handleOpenExportModal}
          disabled={loading || items.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by email..."
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        {(nameFilter || emailFilter) && (
          <button
            onClick={() => {
              setNameFilter("");
              setEmailFilter("");
            }}
            className="text-xs text-zinc-500 hover:text-zinc-700 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-[0.16em]">
            Activity
          </span>
          {!loading && filteredItems.length > 0 && (
            <span className="text-xs text-zinc-400">
              {filteredItems.length} total · Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)}
              {(nameFilter || emailFilter) && ` (filtered from ${items.length})`}
            </span>
          )}
        </div>
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            Loading credit history...
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center text-sm text-red-500">
            Error: {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="px-4 py-8 text-xs text-zinc-400">
            {items.length === 0
              ? "No credit activity yet. Add or remove credits from the Users page to see history here."
              : "No results found for your search criteria."}
          </div>
        ) : (
          <div className="overflow-x-auto text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Email</th>
                  <th className="px-3 py-2 text-left font-medium">Type</th>
                  <th className="px-3 py-2 text-left font-medium">Amount</th>
                  <th className="px-3 py-2 text-left font-medium">Description</th>
                  <th className="px-3 py-2 text-left font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-100 last:border-0 text-xs"
                  >
                    <td className="px-3 py-2 text-zinc-600">{startIndex + idx + 1}.</td>
                    <td className="px-3 py-2 text-zinc-800">{item.name}</td>
                    <td className="px-3 py-2 text-zinc-700">{item.email}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          item.type === "add"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                            : "bg-red-50 text-red-500 border border-red-100"
                        }`}
                      >
                        {item.type === "add" ? "Credit" : "Debit"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-zinc-700">
                      {item.type === "add" ? "+" : "-"}
                      {item.amount} credits
                    </td>
                    <td className="px-3 py-2 text-zinc-800">
                      {item.description || "Super Admin"}
                    </td>
                    <td className="px-3 py-2 text-zinc-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
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

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md mx-4 bg-white rounded-xl shadow-2xl border border-zinc-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Export Credit History</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Choose how to export your data</p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Export All Option */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="exportMode"
                  value="all"
                  checked={exportMode === "all"}
                  onChange={() => setExportMode("all")}
                  className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Export All</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Download all {items.length} records
                  </p>
                </div>
              </label>

              {/* Export by Name Option */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="exportMode"
                  value="name"
                  checked={exportMode === "name"}
                  onChange={() => setExportMode("name")}
                  className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Export by Name</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Filter records by user name</p>
                  {exportMode === "name" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Enter name to filter..."
                        value={exportNameFilter}
                        onChange={(e) => setExportNameFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        autoFocus
                      />
                      {exportNameFilter.trim() && (
                        <p className="text-xs text-emerald-600 mt-1.5">
                          {exportItems.length} records match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </label>

              {/* Export by Email Option */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50">
                <input
                  type="radio"
                  name="exportMode"
                  value="email"
                  checked={exportMode === "email"}
                  onChange={() => setExportMode("email")}
                  className="mt-0.5 h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">Export by Email</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Filter records by user email</p>
                  {exportMode === "email" && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Enter email to filter..."
                        value={exportEmailFilter}
                        onChange={(e) => setExportEmailFilter(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        autoFocus
                      />
                      {exportEmailFilter.trim() && (
                        <p className="text-xs text-emerald-600 mt-1.5">
                          {exportItems.length} records match
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-zinc-100 bg-zinc-50 rounded-b-xl">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExportCSV}
                disabled={isExportDisabled()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
