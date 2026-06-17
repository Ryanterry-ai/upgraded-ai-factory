import * as cheerio from "cheerio";

export interface ScrapedContent {
  url: string;
  title: string;
  description: string;
  headings: { level: number; text: string }[];
  navigation: string[];
  sections: { tag: string; text: string; className?: string }[];
  images: { src: string; alt: string }[];
  links: { href: string; text: string }[];
  colors: string[];
  bodyText: string;
  metaTags: Record<string, string>;
  structuredData: unknown[];
}

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

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const normalizedUrl = normalizeUrl(url);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(normalizedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove scripts, styles, comments
    $("script, style, noscript, iframe, svg").remove();

    // Title
    const title = $("title").first().text().trim() ||
      $("h1").first().text().trim() ||
      "Untitled";

    // Meta description
    const description = $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $("p").first().text().trim().slice(0, 300) ||
      "";

    // Headings
    const headings: { level: number; text: string }[] = [];
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 1) {
        headings.push({
          level: parseInt(el.tagName?.replace("h", "") || "1"),
          text,
        });
      }
    });

    // Navigation links
    const navigation: string[] = [];
    $("nav a, header a, [role='navigation'] a").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 50) navigation.push(text);
    });

    // Sections / content blocks
    const sections: { tag: string; text: string; className?: string }[] = [];
    $("section, article, [role='main'], main > div, .hero, .banner, .features, .about, .services").each((_, el) => {
      const text = $(el).text().trim().replace(/\s+/g, " ").slice(0, 500);
      if (text && text.length > 20) {
        sections.push({
          tag: el.tagName || "div",
          text,
          className: $(el).attr("class")?.trim(),
        });
      }
    });

    // If no sections found, extract main content blocks
    if (sections.length === 0) {
      $("main div, #content div, #main div").each((_, el) => {
        const text = $(el).text().trim().replace(/\s+/g, " ").slice(0, 500);
        if (text && text.length > 30) {
          sections.push({
            tag: el.tagName || "div",
            text,
            className: $(el).attr("class")?.trim(),
          });
        }
      });
    }

    // Images
    const images: { src: string; alt: string }[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      const alt = $(el).attr("alt") || "";
      if (src && !src.startsWith("data:")) {
        let fullSrc = src;
        if (src.startsWith("//")) fullSrc = `https:${src}`;
        else if (src.startsWith("/")) fullSrc = new URL(src, normalizedUrl).href;
        else if (!src.startsWith("http")) fullSrc = new URL(src, normalizedUrl).href;
        images.push({ src: fullSrc, alt });
      }
    });

    // Links
    const links: { href: string; text: string }[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim();
      if (text && text.length < 80 && href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        links.push({ href, text });
      }
    });

    // Extract colors from inline styles and CSS
    const colors = new Set<string>();
    $("[style]").each((_, el) => {
      const style = $(el).attr("style") || "";
      const colorMatches = style.match(/(?:background-color|color|border-color):\s*([^;]+)/gi);
      if (colorMatches) {
        colorMatches.forEach((m) => {
          const val = m.split(":")[1]?.trim();
          if (val && val !== "transparent" && val !== "inherit" && val !== "currentColor") {
            colors.add(val);
          }
        });
      }
    });

    // Extract from class names that look like color utilities
    $("[class]").each((_, el) => {
      const cls = $(el).attr("class") || "";
      const bgMatch = cls.match(/bg-\[([^\]]+)\]/);
      if (bgMatch) colors.add(bgMatch[1]);
    });

    // Meta tags
    const metaTags: Record<string, string> = {};
    $("meta[name], meta[property]").each((_, el) => {
      const name = $(el).attr("name") || $(el).attr("property") || "";
      const content = $(el).attr("content") || "";
      if (name && content) metaTags[name] = content;
    });

    // Structured data
    const structuredData: unknown[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || "");
        structuredData.push(data);
      } catch {}
    });

    // Body text (cleaned)
    const bodyText = $("body").text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);

    return {
      url: normalizedUrl,
      title,
      description,
      headings,
      navigation,
      sections,
      images: images.slice(0, 20),
      links: links.slice(0, 30),
      colors: Array.from(colors).slice(0, 10),
      bodyText,
      metaTags,
      structuredData,
    };
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(
      `Failed to scrape ${normalizedUrl}: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }
}

export function formatScrapedForLLM(scraped: ScrapedContent): string {
  const sections = scraped.sections.slice(0, 8).map((s, i) =>
    `Section ${i + 1}: ${s.text.slice(0, 300)}`
  ).join("\n");

  const headings = scraped.headings.slice(0, 10).map(h =>
    `H${h.level}: ${h.text}`
  ).join("\n");

  const nav = scraped.navigation.slice(0, 8).join(", ");

  return `
SOURCE WEBSITE ANALYSIS:
- Title: ${scraped.title}
- Description: ${scraped.description}
- Navigation: ${nav}

HEADINGS:
${headings}

CONTENT SECTIONS:
${sections}

COLORS FOUND: ${scraped.colors.join(", ") || "not detected"}

IMAGES: ${scraped.images.slice(0, 5).map(i => `${i.alt || "image"}: ${i.src.slice(0, 100)}`).join("\n  ")}
`.trim();
}
