"use client";

import { Globe2, ListChecks, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface CrawledPage {
  url: string;
  status: "ok" | "error";
  wordCount: number;
  content: string;
}

export default function CrawlerPage() {
  const [domainUrl, setDomainUrl] = useState("");
  const [pagesInput, setPagesInput] = useState("");
  const [siteResults, setSiteResults] = useState<CrawledPage[]>([]);
  const [pageResults, setPageResults] = useState<CrawledPage[]>([]);
  const [loadingSite, setLoadingSite] = useState(false);
  const [loadingPages, setLoadingPages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSitePage, setSelectedSitePage] = useState<CrawledPage | null>(null);
  const [selectedListPage, setSelectedListPage] = useState<CrawledPage | null>(null);

  const downloadCsv = (pages: CrawledPage[], filename: string) => {
    if (!pages.length) return;

    const escape = (val: string | number) =>
      `"${String(val)
        .replace(/"/g, '""')
        .replace(/\r?\n/g, " ")}"`;

    const header = ["url", "wordCount", "content"].join(",");

    const rows = pages.map((p) =>
      [escape(p.url), escape(p.wordCount || 0), escape(p.content)].join(","),
    );

    const csv = [header, ...rows].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFullSiteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainUrl.trim()) return;

    setLoadingSite(true);
    setError(null);
    setSiteResults([]);
    setSelectedSitePage(null);

    try {
      const res = await fetch("/api/crawler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "domain", url: domainUrl.trim(), maxPages: 60 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to crawl domain");
      }

      setSiteResults(data.pages ?? []);
      setSelectedSitePage(data.pages?.[0] ?? null);
    } catch (err) {
      console.error(err);
      setError("Domain crawl fail ho gaya. Thodi der baad phir try karo.");
    } finally {
      setLoadingSite(false);
    }
  };

  const handlePageListSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = pagesInput
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (!raw.length) return;

    setLoadingPages(true);
    setError(null);
    setPageResults([]);
    setSelectedListPage(null);

    try {
      const res = await fetch("/api/crawler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "pages", urls: raw }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to crawl pages");
      }

      setPageResults(data.pages ?? []);
      setSelectedListPage(data.pages?.[0] ?? null);
    } catch (err) {
      console.error(err);
      setError("Page list crawl fail ho gaya. Thodi der baad phir try karo.");
    } finally {
      setLoadingPages(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700 mb-3">
            <Globe2 className="h-3 w-3" />
            <span>Website crawler</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Crawler</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Do modes: 1) single main domain se poori site crawl karega, 2) specific page URLs ki
            list se sirf unhi pages ko crawl karega. Abhi ke liye yeh demo data show karega – baad
            me backend API se live connect kar sakte hain.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Full site crawl */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="glass-panel flex flex-col gap-4"
        >
          <div className="px-4 pt-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-emerald-500" />
                Full site crawl
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Ek main domain URL do, crawler us domain ke popular pages crawl karega.
              </p>
            </div>
          </div>
          <form onSubmit={handleFullSiteSubmit} className="px-4 pb-3 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">
                Main domain URL
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={domainUrl}
                onChange={(e) => setDomainUrl(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={loadingSite}
            >
              <PlayCircle className="h-4 w-4" />
              {loadingSite ? "Crawling domain..." : "Start full site crawl"}
            </button>
          </form>

          <div className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 space-y-3">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
                {error}
              </div>
            )}
            {loadingSite && <span>Domain crawl chal raha hai... thoda time lag sakta hai.</span>}
            {!loadingSite && siteResults.length === 0 && !error && (
              <span>Result yahan show honge. Upar domain daal ke crawl chalao.</span>
            )}
            {!loadingSite && siteResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{siteResults.length} pages crawled</span>
                  <div className="flex items-center gap-2">
                    <span>
                      ~
                      {siteResults
                        .reduce((acc, r) => acc + (r.wordCount || 0), 0)
                        .toLocaleString("en-US")}{" "}
                      words
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        downloadCsv(
                          siteResults,
                          `crawl-domain-${
                            siteResults[0]?.url
                              ? new URL(siteResults[0].url).hostname
                              : "site"
                          }.csv`,
                        )
                      }
                      className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Download CSV
                    </button>
                  </div>
                </div>
                <div className="max-h-52 overflow-auto rounded-lg border border-zinc-100 bg-zinc-50/60">
                  <table className="w-full text-[11px]">
                    <thead className="text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">URL</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Words</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siteResults.map((page) => (
                        <tr
                          key={page.url}
                          className="border-t border-zinc-100 cursor-pointer hover:bg-emerald-50/40"
                          onClick={() => setSelectedSitePage(page)}
                        >
                          <td className="px-3 py-2 text-zinc-800 truncate max-w-[180px]">
                            {page.url}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                              ● {page.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-zinc-700">
                            {(page.wordCount || 0).toLocaleString("en-US")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedSitePage && (
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-700 max-h-48 overflow-auto">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-zinc-900">
                        Content preview – {selectedSitePage.url}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {selectedSitePage.wordCount.toLocaleString("en-US")} words
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {selectedSitePage.content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.section>

        {/* Page list crawl */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.25 }}
          className="glass-panel flex flex-col gap-4"
        >
          <div className="px-4 pt-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-500" />
                Specific pages crawl
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Yahan pe tum specific URLs ki list doge (comma ya newline separated) – crawler sirf
                unhi pages ko hit karega.
              </p>
            </div>
          </div>
          <form onSubmit={handlePageListSubmit} className="px-4 pb-3 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-600">
                Page URLs (comma / newline separated)
              </label>
              <textarea
                rows={5}
                placeholder={`https://example.com/\nhttps://example.com/blog\nhttps://example.com/pricing`}
                value={pagesInput}
                onChange={(e) => setPagesInput(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 resize-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              disabled={loadingPages}
            >
              <PlayCircle className="h-4 w-4" />
              {loadingPages ? "Crawling pages..." : "Start page list crawl"}
            </button>
          </form>

          <div className="border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 space-y-3">
            {loadingPages && (
              <span>Selected pages crawl ho rahe hain... thodi der me content aa jayega.</span>
            )}
            {!loadingPages && pageResults.length === 0 && !error && (
              <span>Result yahan dikhengay. Upar kuch URLs paste karke crawl start karo.</span>
            )}
            {!loadingPages && pageResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                  <span>{pageResults.length} pages crawled</span>
                  <div className="flex items-center gap-2">
                    <span>
                      ~
                      {pageResults
                        .reduce((acc, r) => acc + (r.wordCount || 0), 0)
                        .toLocaleString("en-US")}{" "}
                      words
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadCsv(pageResults, "crawl-pages.csv")}
                      className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-50"
                    >
                      Download CSV
                    </button>
                  </div>
                </div>
                <div className="max-h-52 overflow-auto rounded-lg border border-zinc-100 bg-zinc-50/60">
                  <table className="w-full text-[11px]">
                    <thead className="text-zinc-500">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">URL</th>
                        <th className="px-3 py-2 text-left font-medium">Status</th>
                        <th className="px-3 py-2 text-right font-medium">Words</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageResults.map((page) => (
                        <tr
                          key={page.url}
                          className="border-t border-zinc-100 cursor-pointer hover:bg-emerald-50/40"
                          onClick={() => setSelectedListPage(page)}
                        >
                          <td className="px-3 py-2 text-zinc-800 truncate max-w-[180px]">
                            {page.url}
                          </td>
                          <td className="px-3 py-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                              ● {page.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-zinc-700">
                            {(page.wordCount || 0).toLocaleString("en-US")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedListPage && (
                  <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] text-zinc-700 max-h-48 overflow-auto">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-zinc-900">
                        Content preview – {selectedListPage.url}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {selectedListPage.wordCount.toLocaleString("en-US")} words
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {selectedListPage.content}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}


