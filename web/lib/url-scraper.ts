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
  fullHtml?: string;
  components: ExtractedComponents;
  products: ExtractedProduct[];
  breadcrumbs: string[];
  forms: ExtractedForm[];
}

export interface ExtractedComponents {
  header: { exists: boolean; html?: string; links?: { text: string; href: string }[] };
  footer: { exists: boolean; html?: string; links?: { text: string; href: string }[]; socialLinks?: string[]; contact?: { email?: string; phone?: string; address?: string } };
  sidebar: { exists: boolean; html?: string; items?: string[] };
  tabs: { exists: boolean; items?: string[] };
}

export interface ExtractedProduct {
  name: string;
  price: string;
  image?: string;
  description?: string;
  url?: string;
}

export interface ExtractedForm {
  action?: string;
  method?: string;
  fields: { type: string; name?: string; placeholder?: string; label?: string }[];
}

export interface SecurityHeaders {
  present: string[];
  missing: string[];
  score: number;
}

export interface ScrapedAsset {
  url: string;
  localPath: string;
  buffer: ArrayBuffer;
  contentType: string;
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
  assets: ScrapedAsset[];
  securityHeaders?: SecurityHeaders;
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

function getExtFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(png|jpe?g|gif|webp|svg|ico|css|js|woff2?|ttf|eot|otf|mp4|webm|json)$/i);
    return match ? match[0].toLowerCase() : "";
  } catch {
    return "";
  }
}

function getContentTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".css": "text/css",
    ".js": "application/javascript",
    ".mjs": "application/javascript",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".ttf": "font/ttf",
    ".eot": "application/vnd.ms-fontobject",
    ".otf": "font/otf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".json": "application/json",
  };
  return map[ext] || "application/octet-stream";
}

function getLocalPath(url: string, kind: "images" | "css" | "js" | "fonts" | "videos" | "media"): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split("/").filter(Boolean);
    const filename = segments.pop() || "file";
    // Add hash to avoid collisions
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
    }
    const ext = getExtFromUrl(url) || ".bin";
    const base = filename.replace(/\.[^.]+$/, "") || "file";
    return `/${kind}/${Math.abs(hash).toString(36)}-${base}${ext}`;
  } catch {
    return `/${kind}/unknown-${Date.now()}.bin`;
  }
}

const SKIP_EXTENSIONS = /\.(png|jpe?g|gif|webp|ico|css|js|woff2?|ttf|eot|mp4|mp3|pdf|zip)$/i;
const SKIP_PATHS = /^(\/wp-admin|\/wp-login|\/wp-content|\/api|\/admin|\/login|\/register|\/cart|\/checkout|#|\?)/;

// ── Tech Detection ─────────────────────────────────────────

function detectTechStack(html: string, $: cheerio.CheerioAPI): string[] {
  const tech: string[] = [];

  if ($("meta[name='generator'][content*='WordPress']").length) tech.push("WordPress");
  if ($("link[href*='wp-content']").length || $("script[src*='wp-content']").length) tech.push("WordPress");
  if ($("meta[name='generator'][content*='Next']").length || $("script[id='__NEXT_DATA__']").length) tech.push("Next.js");
  if ($("div[id='__nuxt']").length || $("script[src*='nuxt']").length) tech.push("Nuxt.js");
  if ($("div[id='__gatsby']").length) tech.push("Gatsby");
  if ($("meta[name='generator'][content*='Hugo']").length) tech.push("Hugo");
  if ($("meta[name='generator'][content*='Jekyll']").length) tech.push("Jekyll");
  if ($("meta[name='generator'][content*='Shopify']").length) tech.push("Shopify");
  if ($("script[src*='shopify']").length) tech.push("Shopify");

  if ($("[class*='flex']").length > 5 || $("[class*='grid']").length > 5) tech.push("Flexbox/Grid");
  if ($("link[href*='bootstrap']").length || $("[class*='container']").length > 3) tech.push("Bootstrap");
  if ($("link[href*='tailwind']").length || $("[class*='tw-']").length || $("[class*='bg-']").length > 10) tech.push("Tailwind CSS");
  if ($("link[href*='bulma']").length) tech.push("Bulma");
  if ($("link[href*='materialize']").length) tech.push("Materialize");

  if ($("script[src*='react']").length || $("[data-reactroot]").length) tech.push("React");
  if ($("script[src*='vue']").length || $("[data-v-]").length) tech.push("Vue.js");
  if ($("script[src*='angular']").length || $("[ng-app]").length || $("[data-ng-app]").length) tech.push("Angular");
  if ($("script[src*='jquery']").length || $("[class*='jquery']").length) tech.push("jQuery");
  if ($("script[src*='gsap']").length || $("script[src*='greensock']").length) tech.push("GSAP");
  if ($("script[src*='framer']").length) tech.push("Framer Motion");

  if ($("script[src*='google-analytics']").length || $("script[src*='gtag']").length) tech.push("Google Analytics");
  if ($("script[src*='gtm']").length || $("noscript iframe[src*='gtm']").length) tech.push("Google Tag Manager");
  if ($("script[src*='hotjar']").length) tech.push("Hotjar");
  if ($("script[src*='segment']").length) tech.push("Segment");
  if ($("script[src*='intercom']").length) tech.push("Intercom");
  if ($("script[src*='crisp']").length) tech.push("Crisp");
  if ($("script[src*='hubspot']").length) tech.push("HubSpot");

  return [...new Set(tech)];
}

// ── Component Extraction ────────────────────────────────────

function extractComponents($: cheerio.CheerioAPI, pageUrl: string): ExtractedComponents {
  // Header extraction
  const headerEl = $("header, [role='banner'], .header, .navbar, nav").first();
  const headerLinks: { text: string; href: string }[] = [];
  headerEl.find("a[href]").each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr("href") || "";
    if (text && text.length < 50) headerLinks.push({ text, href: resolveUrl(href, pageUrl) || href });
  });

  // Footer extraction
  const footerEl = $("footer, [role='contentinfo'], .footer").first();
  const footerLinks: { text: string; href: string }[] = [];
  const socialLinks: string[] = [];
  const contact: { email?: string; phone?: string; address?: string } = {};

  footerEl.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim().toLowerCase();
    const fullHref = resolveUrl(href, pageUrl) || href;

    if (text.match(/twitter|x\.com|facebook|instagram|linkedin|youtube|github|tiktok/i) || href.match(/twitter\.com|x\.com|facebook\.com|instagram\.com|linkedin\.com|youtube\.com|github\.com|tiktok\.com/i)) {
      socialLinks.push(fullHref);
    } else if (text && text.length < 50) {
      footerLinks.push({ text, href: fullHref });
    }
  });

  const footerText = footerEl.text();
  const emailMatch = footerText.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  const phoneMatch = footerText.match(/[\+]?[\d\s\-\(\)]{7,15}/);
  const addressMatch = footerText.match(/\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Court|Ct|Way|Lane|Ln)[\w\s,]*/i);
  if (emailMatch) contact.email = emailMatch[0];
  if (phoneMatch) contact.phone = phoneMatch[0].trim();
  if (addressMatch) contact.address = addressMatch[0].trim();

  // Sidebar extraction
  const sidebarEl = $("[role='complementary'], .sidebar, aside, [class*='sidebar']").first();
  const sidebarItems: string[] = [];
  sidebarEl.find("a, li, .menu-item, .nav-item").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 50 && !sidebarItems.includes(text)) sidebarItems.push(text);
  });

  // Tabs extraction
  const tabEls = $("[role='tablist'], .tabs, [class*='tab-'], .nav-tabs");
  const tabItems: string[] = [];
  tabEls.find("[role='tab'], .tab, a, button").each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length < 30 && !tabItems.includes(text)) tabItems.push(text);
  });

  return {
    header: {
      exists: headerEl.length > 0,
      html: headerEl.html()?.slice(0, 3000),
      links: headerLinks.slice(0, 20),
    },
    footer: {
      exists: footerEl.length > 0,
      html: footerEl.html()?.slice(0, 3000),
      links: footerLinks.slice(0, 20),
      socialLinks: [...new Set(socialLinks)].slice(0, 10),
      contact,
    },
    sidebar: {
      exists: sidebarEl.length > 0,
      html: sidebarEl.html()?.slice(0, 2000),
      items: sidebarItems.slice(0, 15),
    },
    tabs: {
      exists: tabEls.length > 0,
      items: tabItems.slice(0, 10),
    },
  };
}

// ── Product Extraction ──────────────────────────────────────

function extractProducts($: cheerio.CheerioAPI, pageUrl: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = [];
  const productSelectors = [
    "[class*='product']",
    "[class*='item']",
    "[data-product]",
    "[itemtype*='Product']",
    ".product-card",
    ".product-item",
    ".ecommerce-item",
  ];

  for (const selector of productSelectors) {
    $(selector).each((_, el) => {
      const nameEl = $(el).find("[class*='name'], [class*='title'], h2, h3, h4, .product-title, .product-name").first();
      const priceEl = $(el).find("[class*='price'], .price, .amount, [data-price]").first();
      const imgEl = $(el).find("img").first();
      const descEl = $(el).find("[class*='desc'], [class*='description'], p").first();
      const linkEl = $(el).find("a[href]").first();

      const name = nameEl.text().trim();
      const price = priceEl.text().trim();

      if (name && name.length > 1 && name.length < 200) {
        const product: ExtractedProduct = { name, price: price || "" };
        const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";
        if (imgSrc) product.image = resolveUrl(imgSrc, pageUrl) || imgSrc;
        const desc = descEl.text().trim().slice(0, 300);
        if (desc) product.description = desc;
        const href = linkEl.attr("href");
        if (href) product.url = resolveUrl(href, pageUrl) || href;

        if (!products.some(p => p.name === name)) {
          products.push(product);
        }
      }
    });
  }

  // Also check structured data for products
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      if (data["@type"] === "Product") {
        const product: ExtractedProduct = {
          name: data.name || "",
          price: data.offers?.price ? `$${data.offers.price}` : "",
          description: data.description?.slice(0, 300),
        };
        if (data.image) product.image = Array.isArray(data.image) ? data.image[0] : data.image;
        if (product.name && !products.some(p => p.name === product.name)) {
          products.push(product);
        }
      }
      if (data["@type"] === "ItemList" && Array.isArray(data.itemListElement)) {
        for (const item of data.itemListElement) {
          if (item.item?.["@type"] === "Product") {
            const product: ExtractedProduct = {
              name: item.item.name || "",
              price: item.item.offers?.price ? `$${item.item.offers.price}` : "",
              description: item.item.description?.slice(0, 300),
            };
            if (item.item.image) product.image = Array.isArray(item.item.image) ? item.item.image[0] : item.item.image;
            if (product.name && !products.some(p => p.name === product.name)) {
              products.push(product);
            }
          }
        }
      }
    } catch {}
  });

  return products.slice(0, 30);
}

// ── Breadcrumb Extraction ───────────────────────────────────

function extractBreadcrumbs($: cheerio.CheerioAPI): string[] {
  const breadcrumbs: string[] = [];

  // Check structured data first
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      if (data["@type"] === "BreadcrumbList" && Array.isArray(data.itemListElement)) {
        for (const item of data.itemListElement) {
          if (item.name) breadcrumbs.push(item.name);
        }
      }
    } catch {}
  });

  // If no structured data, check HTML
  if (breadcrumbs.length === 0) {
    const breadcrumbEl = $("[aria-label*='breadcrumb'], [class*='breadcrumb'], .breadcrumbs, nav ol, nav ul").first();
    breadcrumbEl.find("li, a, span").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50 && !breadcrumbs.includes(text)) {
        breadcrumbs.push(text);
      }
    });
  }

  return breadcrumbs.slice(0, 10);
}

// ── Form Extraction ─────────────────────────────────────────

function extractForms($: cheerio.CheerioAPI): ExtractedForm[] {
  const forms: ExtractedForm[] = [];

  $("form").each((_, el) => {
    const form: ExtractedForm = {
      action: $(el).attr("action") || undefined,
      method: $(el).attr("method") || "GET",
      fields: [],
    };

    $(el).find("input, textarea, select").each((_, field) => {
      const type = $(field).attr("type") || (field.tagName === "textarea" ? "textarea" : field.tagName === "select" ? "select" : "text");
      if (type === "hidden" || type === "submit" || type === "button") return;

      const name = $(field).attr("name") || undefined;
      const placeholder = $(field).attr("placeholder") || undefined;
      const label = $(`label[for="${$(field).attr("id")}"]`).text().trim() || undefined;

      form.fields.push({ type, name, placeholder, label });
    });

    if (form.fields.length > 0) {
      forms.push(form);
    }
  });

  return forms.slice(0, 10);
}

// ── Security Headers ────────────────────────────────────────

export async function detectSecurityHeaders(url: string): Promise<SecurityHeaders> {
  const securityHeaders = [
    "strict-transport-security",
    "content-security-policy",
    "x-content-type-options",
    "x-frame-options",
    "x-xss-protection",
    "referrer-policy",
    "permissions-policy",
    "cross-origin-opener-policy",
    "cross-origin-resource-policy",
    "cross-origin-embedder-policy",
  ];

  try {
    const resp = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(10000),
    });

    const present: string[] = [];
    const missing: string[] = [];

    for (const header of securityHeaders) {
      if (resp.headers.get(header)) {
        present.push(header);
      } else {
        missing.push(header);
      }
    }

    const score = Math.round((present.length / securityHeaders.length) * 100);
    return { present, missing, score };
  } catch {
    return { present: [], missing: securityHeaders, score: 0 };
  }
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
    const components = extractComponents($, url);
    const products = extractProducts($, url);
    const breadcrumbs = extractBreadcrumbs($);
    const forms = extractForms($);

    return {
      url,
      path: getPathFromUrl(url),
      title,
      description,
      headings,
      sections,
      images: images.slice(0, 50),
      links,
      navItems,
      colors: Array.from(colors).slice(0, 10),
      bodyText,
      metaTags,
      structuredData,
      techStack,
      components,
      products,
      breadcrumbs,
      forms,
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
      components: { header: { exists: false }, footer: { exists: false }, sidebar: { exists: false }, tabs: { exists: false } },
      products: [],
      breadcrumbs: [],
      forms: [],
    };
  }
}

// ── Asset Discovery ────────────────────────────────────────

function discoverAssets(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  const assetUrls = new Set<string>();

  // Images
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
    if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
      let full = src;
      if (src.startsWith("//")) full = `https:${src}`;
      else if (src.startsWith("/")) full = new URL(src, pageUrl).href;
      else if (!src.startsWith("http")) full = new URL(src, pageUrl).href;
      if (full.startsWith("http")) assetUrls.add(full);
    }
  });

  // Background images in inline styles
  $("[style]").each((_, el) => {
    const style = $(el).attr("style") || "";
    const matches = style.match(/url\(["']?([^"')]+)["']?\)/g);
    if (matches) {
      matches.forEach(m => {
        const urlMatch = m.match(/url\(["']?([^"')]+)["']?\)/);
        if (urlMatch && urlMatch[1] && !urlMatch[1].startsWith("data:")) {
          let full = urlMatch[1];
          if (full.startsWith("//")) full = `https:${full}`;
          else if (full.startsWith("/")) full = new URL(full, pageUrl).href;
          else if (!full.startsWith("http")) full = new URL(full, pageUrl).href;
          if (full.startsWith("http")) assetUrls.add(full);
        }
      });
    }
  });

  // CSS files
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      let full = href;
      if (href.startsWith("//")) full = `https:${href}`;
      else if (href.startsWith("/")) full = new URL(href, pageUrl).href;
      else if (!href.startsWith("http")) full = new URL(href, pageUrl).href;
      if (full.startsWith("http")) assetUrls.add(full);
    }
  });

  // JS files
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src && !src.startsWith("data:")) {
      let full = src;
      if (src.startsWith("//")) full = `https:${src}`;
      else if (src.startsWith("/")) full = new URL(src, pageUrl).href;
      else if (!src.startsWith("http")) full = new URL(src, pageUrl).href;
      if (full.startsWith("http")) assetUrls.add(full);
    }
  });

  // Fonts (link preload, @font-face in styles)
  $('link[rel="preload"][as="font"], link[rel="preload"][as="font"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      let full = href;
      if (href.startsWith("/")) full = new URL(href, pageUrl).href;
      else if (!href.startsWith("http")) full = new URL(href, pageUrl).href;
      if (full.startsWith("http")) assetUrls.add(full);
    }
  });

  // Favicons
  $('link[rel*="icon"]').each((_, el) => {
    const href = $(el).attr("href");
    if (href) {
      let full = href;
      if (href.startsWith("/")) full = new URL(href, pageUrl).href;
      else if (!href.startsWith("http")) full = new URL(href, pageUrl).href;
      if (full.startsWith("http")) assetUrls.add(full);
    }
  });

  // Video sources
  $("video source, video").each((_, el) => {
    const src = $(el).attr("src");
    if (src && !src.startsWith("data:")) {
      let full = src;
      if (src.startsWith("/")) full = new URL(src, pageUrl).href;
      else if (!src.startsWith("http")) full = new URL(src, pageUrl).href;
      if (full.startsWith("http")) assetUrls.add(full);
    }
  });

  // OG images
  $('meta[property="og:image"]').each((_, el) => {
    const content = $(el).attr("content");
    if (content && content.startsWith("http")) assetUrls.add(content);
  });

  return Array.from(assetUrls);
}

// ── Multi-Page Crawler ─────────────────────────────────────

export async function scrapeSite(startUrl: string, maxPages = 50): Promise<ScrapedSite> {
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

  // Collect all asset URLs across all pages
  const allAssetUrls = new Set<string>();

  while (toVisit.length > 0 && pages.length < maxPages) {
    const currentUrl = toVisit.shift()!;
    const normalized = currentUrl.split("?")[0].split("#")[0];

    if (visited.has(normalized)) continue;
    if (normalized.match(SKIP_EXTENSIONS)) continue;
    if (normalized.match(SKIP_PATHS)) continue;
    if (!isInternalLink(currentUrl, rootDomain)) continue;

    visited.add(normalized);

    const page = await scrapePage(currentUrl, rootDomain);

    // Fetch full HTML for this page and discover assets
    let htmlFetched = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const resp = await fetch(currentUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
          },
          signal: AbortSignal.timeout(20000),
          redirect: "follow",
        });
        if (resp.ok) {
          let html = await resp.text();
          if (html.length < 100 && attempt === 0) {
            // Too short, likely blocked — retry
            await new Promise(r => setTimeout(r, 1000));
            continue;
          }

          // Discover ALL asset URLs from this page
          const assetUrls = discoverAssets(html, currentUrl);
          for (const url of assetUrls) {
            allAssetUrls.add(url);
          }

          // Rewrite relative URLs to absolute for preview
          const origin = new URL(currentUrl).origin;
          html = html.replace(/(src|href|action)=["']\/(?!\/)/g, `$1="${origin}/`);
          html = html.replace(/url\(["']\/(?!\/)/g, `url("${origin}/`);
          html = html.replace(/<base[^>]*>/gi, "");
          html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${currentUrl}">`);
          page.fullHtml = html;
          htmlFetched = true;
          break;
        }
      } catch (err) {
        console.error(`[Scraper] Attempt ${attempt + 1} failed for ${currentUrl}:`, err instanceof Error ? err.message : err);
        if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
      }
    }
    if (!htmlFetched) {
      console.error(`[Scraper] All attempts failed for ${currentUrl}`);
    }

    pages.push(page);

    page.navItems.forEach((n) => globalNav.add(n));
    page.colors.forEach((c) => globalColors.add(c));
    page.techStack.forEach((t) => globalTech.add(t));

    for (const link of page.links) {
      if (link.isInternal) {
        const clean = link.href.split("?")[0].split("#")[0];
        if (!visited.has(clean) && !clean.match(SKIP_EXTENSIONS) && !clean.match(SKIP_PATHS)) {
          toVisit.push(clean);
        }
      }
    }

    for (const img of page.images) {
      if (!allImages.has(img.src)) {
        const ext = img.src.match(/\.(png|jpe?g|gif|webp|svg)/i)?.[0] || ".png";
        const imgIndex = allImages.size;
        const localPath = `/images/${pages.length}-${imgIndex}${ext}`;
        allImages.set(img.src, { src: img.src, alt: img.alt, localPath });
      }
    }
  }

  // Download all discovered assets in parallel batches
  const downloadedAssets: ScrapedAsset[] = [];
  const assetArray = Array.from(allAssetUrls);
  const BATCH_SIZE = 6;
  let totalDownloaded = 0;
  let totalFailed = 0;

  console.log(`[Scraper] Downloading ${assetArray.length} assets...`);

  for (let i = 0; i < assetArray.length; i += BATCH_SIZE) {
    const batch = assetArray.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (assetUrl) => {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const resp = await fetch(assetUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "*/*",
              },
              signal: AbortSignal.timeout(15000),
              redirect: "follow",
            });
            if (!resp.ok) {
              if (attempt === 0) await new Promise(r => setTimeout(r, 500));
              continue;
            }
            const contentType = resp.headers.get("content-type") || "";
            const buffer = await resp.arrayBuffer();
            if (buffer.byteLength < 10) return null; // Skip empty/tiny files
            const ext = getExtFromUrl(assetUrl);
            const ct = contentType || getContentTypeFromExt(ext);

            // Determine local path based on content type
            let kind: "images" | "css" | "js" | "fonts" | "videos" | "media" = "media";
            if (ct.startsWith("image/")) kind = "images";
            else if (ct.startsWith("font/") || ct.includes("font")) kind = "fonts";
            else if (ct.includes("css")) kind = "css";
            else if (ct.includes("javascript") || ct.includes("ecmascript")) kind = "js";
            else if (ct.startsWith("video/")) kind = "videos";
            else if (ext.match(/^\.(png|jpe?g|gif|webp|svg|ico)$/)) kind = "images";
            else if (ext.match(/^\.(woff2?|ttf|eot|otf)$/)) kind = "fonts";
            else if (ext === ".css") kind = "css";
            else if (ext.match(/^\.(js|mjs)$/)) kind = "js";
            else if (ext.match(/^\.(mp4|webm)$/)) kind = "videos";

            const localPath = getLocalPath(assetUrl, kind);
            return { url: assetUrl, localPath, buffer, contentType: ct };
          } catch {
            if (attempt === 0) await new Promise(r => setTimeout(r, 500));
          }
        }
        return null;
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        downloadedAssets.push(r.value);
        totalDownloaded++;
      } else {
        totalFailed++;
      }
    }
  }

  console.log(`[Scraper] Assets downloaded: ${totalDownloaded}, failed: ${totalFailed}`);

  // Detect security headers
  let securityHeaders: SecurityHeaders | undefined;
  try {
    securityHeaders = await detectSecurityHeaders(normalizedUrl);
    console.log(`[Scraper] Security headers score: ${securityHeaders.score}%`);
  } catch {}

  // Fetch full homepage HTML for preview (if not already fetched)
  let homepageHtml: string | undefined;
  const homePage = pages.find(p => p.path === "/");
  if (homePage?.fullHtml) {
    homepageHtml = homePage.fullHtml;
  } else {
    try {
      const resp = await fetch(normalizedUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(20000),
        redirect: "follow",
      });
      if (resp.ok) {
        let html = await resp.text();
        const baseUrlObj = new URL(normalizedUrl);
        const origin = baseUrlObj.origin;
        html = html.replace(/(src|href|action)=["']\/(?!\/)/g, `$1="${origin}/`);
        html = html.replace(/url\(["']\/(?!\/)/g, `url("${origin}/`);
        html = html.replace(/<base[^>]*>/gi, "");
        html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${normalizedUrl}">`);
        homepageHtml = html;
      }
    } catch {}
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
    assets: downloadedAssets,
    securityHeaders,
  };
}

// ── Formatting for LLM ─────────────────────────────────────

export function formatScrapedForLLM(scraped: ScrapedSite): string {
  const pagesSummary = scraped.pages.map((p, i) => {
    const headings = p.headings.slice(0, 5).map(h => `  H${h.level}: ${h.text}`).join("\n");
    const sections = p.sections.slice(0, 5).map((s, j) => `  Section ${j + 1}: ${s.text.slice(0, 200)}`).join("\n");
    const productInfo = p.products.length > 0 ? `\n  Products: ${p.products.length} found (${p.products.slice(0, 3).map(pr => pr.name).join(", ")})` : "";
    const formInfo = p.forms.length > 0 ? `\n  Forms: ${p.forms.length} found` : "";
    const breadcrumbInfo = p.breadcrumbs.length > 0 ? `\n  Breadcrumbs: ${p.breadcrumbs.join(" > ")}` : "";
    return `Page ${i + 1}: ${p.path}
  Title: ${p.title}
  Description: ${p.description.slice(0, 150)}
  Headings:
${headings}
  Content:
${sections}${productInfo}${formInfo}${breadcrumbInfo}
  Images: ${p.images.length}
  Internal links: ${p.links.filter(l => l.isInternal).length}`;
  }).join("\n\n");

  // Component summary
  const homepagePage = scraped.pages.find(p => p.path === "/");
  const components = homepagePage?.components;
  const componentSummary = components ? `
COMPONENTS:
  Header: ${components.header.exists ? "Yes" : "No"} (${components.header.links?.length || 0} links)
  Footer: ${components.footer.exists ? "Yes" : "No"} (${components.footer.links?.length || 0} links, ${components.footer.socialLinks?.length || 0} social links)
  Sidebar: ${components.sidebar.exists ? "Yes" : "No"} (${components.sidebar.items?.length || 0} items)
  Tabs: ${components.tabs.exists ? "Yes" : "No"} (${components.tabs.items?.length || 0} tabs)
  Contact: ${components.footer.contact?.email ? `Email: ${components.footer.contact.email}` : ""} ${components.footer.contact?.phone ? `Phone: ${components.footer.contact.phone}` : ""}` : "";

  // Security summary
  const securitySummary = scraped.securityHeaders ? `
SECURITY HEADERS:
  Score: ${scraped.securityHeaders.score}%
  Present: ${scraped.securityHeaders.present.join(", ") || "None"}
  Missing: ${scraped.securityHeaders.missing.join(", ") || "None"}` : "";

  // Product summary
  const allProducts = scraped.pages.flatMap(p => p.products);
  const productSummary = allProducts.length > 0 ? `
PRODUCTS (${allProducts.length} total):
${allProducts.slice(0, 10).map(p => `  - ${p.name} | ${p.price}${p.image ? " | [image]" : ""}`).join("\n")}` : "";

  return `
WEBSITE ANALYSIS (${scraped.pages.length} pages crawled):
Root: ${scraped.baseUrl}
Domain: ${scraped.rootDomain}
Tech Stack: ${scraped.techStack.join(", ") || "unknown"}
Global Navigation: ${scraped.navigation.join(", ")}
Global Colors: ${scraped.globalColors.join(", ")}
Total Images: ${scraped.images.length}
Total Assets: ${scraped.assets.length}
${componentSummary}${securitySummary}${productSummary}

PAGES:
${pagesSummary}
`.trim();
}
