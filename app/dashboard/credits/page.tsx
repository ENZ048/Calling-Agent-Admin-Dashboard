"use client";

import { useEffect, useState } from "react";
import { useCreditHistoryStore } from "@/lib/credit-history";
import { History, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function CreditHistoryPage() {
  const { items, loading, error, loadCreditHistory } = useCreditHistoryStore();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch credit history on mount
  useEffect(() => {
    loadCreditHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pagination calculations
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = items.slice(startIndex, endIndex);

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
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-[0.16em]">
            Activity
          </span>
          {!loading && items.length > 0 && (
            <span className="text-xs text-zinc-400">
              {items.length} total · Showing {startIndex + 1}-{Math.min(endIndex, items.length)}
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
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-xs text-zinc-400">
            No credit activity yet. Add or remove credits from the Users page to see history here.
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
              {/* {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
              })} */}
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


