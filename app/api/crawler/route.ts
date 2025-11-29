import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

type CrawlMode = "domain" | "pages";

interface CrawlRequestBase {
  mode: CrawlMode;
}

interface DomainCrawlRequest extends CrawlRequestBase {
  mode: "domain";
  url: string;
  maxPages?: number;
}

interface PagesCrawlRequest extends CrawlRequestBase {
  mode: "pages";
  urls: string[];
}

type CrawlRequest = DomainCrawlRequest | PagesCrawlRequest;

interface CrawlPageResult {
  url: string;
  status: "ok" | "error";
  content: string;
  wordCount: number;
}

interface InternalCrawlResult extends CrawlPageResult {
  links: string[];
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "VoiceAICrawler/1.0 (+https://example.com; contact=admin@example.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      // ensure we always hit network, not Next cache
      cache: "no-store",
    });

    clearTimeout(timeout);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    return await res.text();
  } catch {
    return null;
  }
}

function extractMainContent(html: string): { text: string; links: string[] } {
  const $ = cheerio.load(html);

  // Remove script/style/nav/footer/aside etc. to keep only meaningful text
  ["script", "style", "noscript", "svg", "nav", "footer", "header", "aside"].forEach((sel) => {
    $(sel).remove();
  });

  const bodyText = $("body").text();
  const text = bodyText
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();

  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    links.add(href);
  });

  return { text, links: Array.from(links) };
}

async function crawlSinglePage(url: string): Promise<InternalCrawlResult> {
  const html = await fetchHtml(url);

  if (!html) {
    return {
      url,
      status: "error",
      content: "",
      wordCount: 0,
      links: [],
    };
  }

  const { text, links } = extractMainContent(html);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  return {
    url,
    status: "ok",
    content: text,
    wordCount,
    links,
  };
}

function normalizeDomainUrl(raw: string): string {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  const u = new URL(url);
  // remove hash and query for base
  u.hash = "";
  u.search = "";
  return u.toString();
}

export async function POST(req: NextRequest) {
  let body: CrawlRequest;

  try {
    body = (await req.json()) as CrawlRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.mode === "pages") {
    const rawUrls = (body.urls || []).filter(Boolean);
    if (!rawUrls.length) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    const uniqueUrls = Array.from(new Set(rawUrls));

    const results = await Promise.all(
      uniqueUrls.map((u) => crawlSinglePage(u)),
    );

    const pages: CrawlPageResult[] = results.map(({ links: _links, ...rest }) => rest);

    return NextResponse.json({ pages }, { status: 200 });
  }

  if (body.mode === "domain") {
    if (!body.url) {
      return NextResponse.json({ error: "Domain URL is required" }, { status: 400 });
    }

    const startUrl = normalizeDomainUrl(body.url);
    const origin = new URL(startUrl).origin;

    const maxPages = Math.min(body.maxPages ?? 30, 60);
    const maxDepth = 2;

    const visited = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];
    const collected: InternalCrawlResult[] = [];

    while (queue.length && collected.length < maxPages) {
      const { url, depth } = queue.shift()!;

      // normalise URL without hash
      const current = new URL(url);
      current.hash = "";
      const normalized = current.toString();

      if (visited.has(normalized)) continue;
      visited.add(normalized);

      const result = await crawlSinglePage(normalized);
      collected.push(result);

      if (result.status === "ok" && depth < maxDepth && collected.length < maxPages) {
        for (const href of result.links) {
          try {
            const absolute = new URL(href, normalized);
            if (absolute.origin !== origin) continue;
            // skip obvious non-content routes
            if (absolute.pathname.match(/\.(png|jpe?g|gif|svg|ico|css|js|pdf|zip)$/i)) continue;
            const clean = absolute.toString().split("#")[0];
            if (!visited.has(clean)) {
              queue.push({ url: clean, depth: depth + 1 });
            }
          } catch {
            // ignore invalid URLs
          }
        }
      }
    }

    const pages: CrawlPageResult[] = collected.map(({ links: _links, ...rest }) => rest);

    return NextResponse.json({ pages }, { status: 200 });
  }

  return NextResponse.json({ error: "Unsupported mode" }, { status: 400 });
}


