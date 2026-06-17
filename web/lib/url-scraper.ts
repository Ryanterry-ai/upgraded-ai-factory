import * as cheerio from "cheerio";

// ── Types ──────────────────────────────────────────────────

export interface ScrapedPage {
  url: string;
  path: string;
  title: string;
  description: string;
  headings: { level: number; text: string }[];
  sections: { tag: string; text: string; className?: string; html?: string }[];
  images: { src: string; alt: string; localPath?: string }[];
  links: { href: string; text: string; isInternal: boolean }[];
  navItems: string[];
  colors: string[];
  bodyText: string;
  metaTags: Record<string, string>;
  structuredData: unknown[];
  techStack: string[];
}

export interface ScrapedSite {
  baseUrl: string;
  rootDomain: string;
  pages: ScrapedPage[];
  navigation: string[];
  globalColors: string[];
  globalFonts: string[];
  techStack: string[];
  images: { src: string; alt: string; localPath: string }[];
  homepageHtml?: string;
}

// ── Helpers ────────────────────────────────────────────────

export function isUrl(input: string): boolean {
  const trimmed = input.trim();
  return /^https?:\/\/[^\s]+$/i.test(trimmed) ||
    /^www\.[^\s]+\.[a-z]{2,}/i.test(trimmed);
}

export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return `https://${trimmed}`;
}

function resolveUrl(href: string, base: string): string | null {
  try {
    if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return null;
    if (href.startsWith("//")) return `https:${href}`;
    if (href.startsWith("/")) return new URL(href, base).href;
    if (href.startsWith("http")) return href;
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isInternalLink(href: string, rootDomain: string): boolean {
  try {
    const url = new URL(href);
    return url.hostname === rootDomain || url.hostname === `www.${rootDomain}`;
  } catch {
    return false;
  }
}

function getPathFromUrl(url: string): string {
  try {
    const u = new URL(url);
    let path = u.pathname;
    if (path === "/") return "/";
    if (path.endsWith("/")) path = path.slice(0, -1);
    return path;
  } catch {
    return "/";
  }
}

const SKIP_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|ico|css|js|woff2?|ttf|eot|mp4|mp3|pdf|zip)$/i;
const SKIP_PATHS = /^(\/wp-admin|\/wp-login|\/wp-content|\/api|\/admin|\/login|\/register|\/cart|\/checkout|#|\?)/;

// ── Tech Detection ─────────────────────────────────────────

function detectTechStack(html: string, $: cheerio.CheerioAPI): string[] {
  const tech: string[] = [];

  // Frameworks
  if ($("meta[name='generator'][content*='WordPress']").length) tech.push("WordPress");
  if ($("link[href*='wp-content']").length || $("script[src*='wp-content']").length) tech.push("WordPress");
  if ($("meta[name='generator'][content*='Next']").length || $("script[id='__NEXT_DATA__']").length) tech.push("Next.js");
  if ($("div[id='__nuxt']").length || $("script[src*='nuxt']").length) tech.push("Nuxt.js");
  if ($("div[id='__gatsby']").length) tech.push("Gatsby");
  if ($("meta[name='generator'][content*='Hugo']").length) tech.push("Hugo");
  if ($("meta[name='generator'][content*='Jekyll']").length) tech.push("Jekyll");
  if ($("meta[name='generator'][content*='Shopify']").length) tech.push("Shopify");
  if ($("script[src*='shopify']").length) tech.push("Shopify");

  // CSS frameworks
  if ($("[class*='flex']").length > 5 || $("[class*='grid']").length > 5) tech.push("Flexbox/Grid");
  if ($("link[href*='bootstrap']").length || $("[class*='container']").length > 3) tech.push("Bootstrap");
  if ($("link[href*='tailwind']").length || $("[class*='tw-']").length || $("[class*='bg-']").length > 10) tech.push("Tailwind CSS");
  if ($("link[href*='bulma']").length) tech.push("Bulma");
  if ($("link[href*='materialize']").length) tech.push("Materialize");

  // JS libraries
  if ($("script[src*='react']").length || $("[data-reactroot]").length) tech.push("React");
  if ($("script[src*='vue']").length || $("[data-v-]").length) tech.push("Vue.js");
  if ($("script[src*='angular']").length || $("[ng-app]").length || $("[data-ng-app]").length) tech.push("Angular");
  if ($("script[src*='jquery']").length || $("[class*='jquery']").length) tech.push("jQuery");
  if ($("script[src*='gsap']").length || $("script[src*='greensock']").length) tech.push("GSAP");
  if ($("script[src*='framer']").length) tech.push("Framer Motion");

  // Analytics & tools
  if ($("script[src*='google-analytics']").length || $("script[src*='gtag']").length) tech.push("Google Analytics");
  if ($("script[src*='gtm']").length || $("noscript iframe[src*='gtm']").length) tech.push("Google Tag Manager");
  if ($("script[src*='hotjar']").length) tech.push("Hotjar");
  if ($("script[src*='segment']").length) tech.push("Segment");
  if ($("script[src*='intercom']").length) tech.push("Intercom");
  if ($("script[src*='crisp']").length) tech.push("Crisp");
  if ($("script[src*='hubspot']").length) tech.push("HubSpot");

  return [...new Set(tech)];
}

// ── Page Scraper ───────────────────────────────────────────

async function scrapePage(url: string, rootDomain: string): Promise<ScrapedPage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, noscript, iframe, svg").remove();

    const title = $("title").first().text().trim() ||
      $("h1").first().text().trim() || "Untitled";

    const description = $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $("p").first().text().trim().slice(0, 300) || "";

    const headings: { level: number; text: string }[] = [];
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 1) {
        headings.push({ level: parseInt(el.tagName?.replace("h", "") || "1"), text });
      }
    });

    const navItems: string[] = [];
    $("nav a, header a, [role='navigation'] a").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50) navItems.push(text);
    });

    const sections: { tag: string; text: string; className?: string; html?: string }[] = [];
    $("section, article, [role='main'], main > div, .hero, .banner, .features, .about, .services, .footer, header, footer").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ").slice(0, 800);
      if (text && text.length > 20) {
        sections.push({
          tag: el.tagName || "div",
          text,
          className: $(el).attr("class")?.trim(),
          html: $(el).html()?.slice(0, 2000),
        });
      }
    });

    const images: { src: string; alt: string }[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      const alt = $(el).attr("alt") || "";
      if (src && !src.startsWith("data:")) {
        let fullSrc = src;
        if (src.startsWith("//")) fullSrc = `https:${src}`;
        else if (src.startsWith("/")) fullSrc = new URL(src, url).href;
        else if (!src.startsWith("http")) fullSrc = new URL(src, url).href;
        images.push({ src: fullSrc, alt });
      }
    });

    const links: { href: string; text: string; isInternal: boolean }[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      const resolved = resolveUrl(href, url);
      if (resolved && text && text.length < 80) {
        links.push({ href: resolved, text, isInternal: isInternalLink(resolved, rootDomain) });
      }
    });

    const colors = new Set<string>();
    $("[style]").each((_, el) => {
      const style = $(el).attr("style") || "";
      const colorMatches = style.match(/(?:background-color|color|border-color):\s*([^;]+)/gi);
      if (colorMatches) {
        colorMatches.forEach((m) => {
          const val = m.split(":")[1]?.trim();
          if (val && val !== "transparent" && val !== "inherit" && val !== "currentColor") colors.add(val);
        });
      }
    });
    $("[class]").each((_, el) => {
      const cls = $(el).attr("class") || "";
      const bgMatch = cls.match(/bg-\[([^\]]+)\]/);
      if (bgMatch) colors.add(bgMatch[1]);
    });

    const metaTags: Record<string, string> = {};
    $("meta[name], meta[property]").each((_, el) => {
      const name = $(el).attr("name") || $(el).attr("property") || "";
      const content = $(el).attr("content") || "";
      if (name && content) metaTags[name] = content;
    });

    const structuredData: unknown[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try { structuredData.push(JSON.parse($(el).html() || "")); } catch {}
    });

    const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);
    const techStack = detectTechStack(html, $);

    return {
      url,
      path: getPathFromUrl(url),
      title,
      description,
      headings,
      sections,
      images: images.slice(0, 20),
      links,
      navItems,
      colors: Array.from(colors).slice(0, 10),
      bodyText,
      metaTags,
      structuredData,
      techStack,
    };
  } catch (err) {
    clearTimeout(timeout);
    return {
      url,
      path: getPathFromUrl(url),
      title: "Failed to load",
      description: "",
      headings: [],
      sections: [],
      images: [],
      links: [],
      navItems: [],
      colors: [],
      bodyText: "",
      metaTags: {},
      structuredData: [],
      techStack: [],
    };
  }
}

// ── Multi-Page Crawler ─────────────────────────────────────

export async function scrapeSite(startUrl: string, maxPages = 10): Promise<ScrapedSite> {
  const normalizedUrl = normalizeUrl(startUrl);
  const rootUrl = new URL(normalizedUrl);
  const rootDomain = rootUrl.hostname.replace(/^www\./, "");

  const visited = new Set<string>();
  const toVisit: string[] = [normalizedUrl];
  const pages: ScrapedPage[] = [];
  const allImages: Map<string, { src: string; alt: string; localPath: string }> = new Map();
  const globalNav = new Set<string>();
  const globalColors = new Set<string>();
  const globalFonts = new Set<string>();
  const globalTech = new Set<string>();

  while (toVisit.length > 0 && pages.length < maxPages) {
    const currentUrl = toVisit.shift()!;
    const normalized = currentUrl.split("?")[0].split("#")[0];

    if (visited.has(normalized)) continue;
    if (normalized.match(SKIP_EXTENSIONS)) continue;
    if (normalized.match(SKIP_PATHS)) continue;
    // Only crawl same domain
    if (!isInternalLink(currentUrl, rootDomain)) continue;

    visited.add(normalized);

    const page = await scrapePage(currentUrl, rootDomain);
    pages.push(page);

    // Collect global data
    page.navItems.forEach((n) => globalNav.add(n));
    page.colors.forEach((c) => globalColors.add(c));
    page.techStack.forEach((t) => globalTech.add(t));

    // Queue internal links
    for (const link of page.links) {
      if (link.isInternal) {
        const clean = link.href.split("?")[0].split("#")[0];
        if (!visited.has(clean) && !clean.match(SKIP_EXTENSIONS) && !clean.match(SKIP_PATHS)) {
          toVisit.push(clean);
        }
      }
    }

    // Collect images
    for (const img of page.images) {
      if (!allImages.has(img.src)) {
        const ext = img.src.match(/\.(png|jpe?g|gif|webp|svg)/i)?.[0] || ".png";
        const imgIndex = allImages.size;
        const localPath = `/images/${pages.length}-${imgIndex}${ext}`;
        allImages.set(img.src, { src: img.src, alt: img.alt, localPath });
      }
    }
  }

  // Fetch full homepage HTML for preview
  let homepageHtml: string | undefined;
  try {
    const resp = await fetch(normalizedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(15000),
    });
    if (resp.ok) {
      let html = await resp.text();
      // Rewrite relative URLs to absolute
      const baseUrlObj = new URL(normalizedUrl);
      const origin = baseUrlObj.origin;
      // Fix src="/..." and href="/..."
      html = html.replace(/(src|href|action)=["']\/(?!\/)/g, `$1="${origin}/`);
      // Fix url("/...")
      html = html.replace(/url\(["']\/(?!\/)/g, `url("${origin}/`);
      // Remove base tags that might interfere
      html = html.replace(/<base[^>]*>/gi, "");
      // Add base tag for relative paths
      html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${normalizedUrl}">`);
      homepageHtml = html;
    }
  } catch {
    // Non-critical — fallback to reconstructed preview
  }

  return {
    baseUrl: normalizedUrl,
    rootDomain,
    pages,
    navigation: Array.from(globalNav).slice(0, 8),
    globalColors: Array.from(globalColors).slice(0, 10),
    globalFonts: Array.from(globalFonts),
    techStack: Array.from(globalTech),
    images: Array.from(allImages.values()),
    homepageHtml,
  };
}

// ── Formatting for LLM ─────────────────────────────────────

export function formatScrapedForLLM(scraped: ScrapedSite): string {
  const pagesSummary = scraped.pages.map((p, i) => {
    const headings = p.headings.slice(0, 5).map(h => `  H${h.level}: ${h.text}`).join("\n");
    const sections = p.sections.slice(0, 5).map((s, j) => `  Section ${j + 1}: ${s.text.slice(0, 200)}`).join("\n");
    return `Page ${i + 1}: ${p.path}
  Title: ${p.title}
  Description: ${p.description.slice(0, 150)}
  Headings:
${headings}
  Content:
${sections}
  Images: ${p.images.length}
  Internal links: ${p.links.filter(l => l.isInternal).length}`;
  }).join("\n\n");

  return `
WEBSITE ANALYSIS (${scraped.pages.length} pages crawled):
Root: ${scraped.baseUrl}
Domain: ${scraped.rootDomain}
Tech Stack: ${scraped.techStack.join(", ") || "unknown"}
Global Navigation: ${scraped.navigation.join(", ")}
Global Colors: ${scraped.globalColors.join(", ")}
Total Images: ${scraped.images.length}

PAGES:
${pagesSummary}
`.trim();
}
