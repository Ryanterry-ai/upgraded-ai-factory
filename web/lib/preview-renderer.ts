/**
 * Generates a standalone HTML preview from scraped website data.
 * Uses the actual scraped content (headings, sections, images, nav)
 * to render a realistic preview in the iframe.
 */

interface ScrapedPage {
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

interface ScrapedSite {
  baseUrl: string;
  rootDomain: string;
  pages: ScrapedPage[];
  navigation: string[];
  globalColors: string[];
  globalFonts: string[];
  techStack: string[];
  images: { src: string; alt: string; localPath: string }[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getColors(scraped: ScrapedSite): { primary: string; secondary: string; accent: string; bg: string; text: string } {
  const colors = scraped.globalColors;
  return {
    primary: colors[0] || "#7c3aed",
    secondary: colors[1] || "#ec4899",
    accent: colors[2] || "#06b6d4",
    bg: "#09090b",
    text: "#fafafa",
  };
}

function renderNav(scraped: ScrapedSite, colors: ReturnType<typeof getColors>): string {
  const items = scraped.navigation.length > 0
    ? scraped.navigation
    : scraped.pages[0]?.navItems?.slice(0, 6) || [];

  const brand = scraped.pages[0]?.title || scraped.rootDomain;

  return `
    <nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:rgba(0,0,0,0.8);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,0.05);position:sticky;top:0;z-index:100;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,${colors.primary},${colors.secondary});display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:14px;font-weight:700;">${brand.charAt(0).toUpperCase()}</span>
        </div>
        <span style="font-weight:600;color:white;font-size:14px;">${escapeHtml(brand.slice(0, 20))}</span>
      </div>
      <div style="display:flex;align-items:center;gap:24px;">
        ${items.slice(0, 6).map(item => `
          <a href="#" style="font-size:13px;color:#a1a1aa;text-decoration:none;transition:color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#a1a1aa'">${escapeHtml(item)}</a>
        `).join("")}
      </div>
    </nav>`;
}

function renderHero(scraped: ScrapedSite, colors: ReturnType<typeof getColors>): string {
  const homePage = scraped.pages.find(p => p.path === "/") || scraped.pages[0];
  if (!homePage) return "";

  // Find the main heading (H1 or first H2)
  const mainHeading = homePage.headings.find(h => h.level === 1) || homePage.headings[0];
  const title = mainHeading?.text || homePage.title;

  // Get subtitle from description or second heading
  const subtitle = homePage.description || homePage.headings[1]?.text || "";

  // Get first section text as body
  const bodySection = homePage.sections.find(s => s.text.length > 20);
  const body = bodySection?.text?.slice(0, 200) || "";

  return `
    <section style="position:relative;padding:80px 24px;text-align:center;overflow:hidden;">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at center,${colors.primary}15 0%,transparent 70%);"></div>
      <div style="position:relative;max-width:800px;margin:0 auto;">
        <h1 style="font-size:clamp(32px,5vw,56px);font-weight:800;color:white;line-height:1.1;margin-bottom:24px;letter-spacing:-0.02em;">
          ${escapeHtml(title)}
        </h1>
        ${subtitle ? `<p style="font-size:18px;color:#a1a1aa;margin-bottom:32px;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.6;">${escapeHtml(subtitle.slice(0, 200))}</p>` : ""}
        ${body ? `<p style="font-size:15px;color:#71717a;margin-bottom:40px;max-width:500px;margin-left:auto;margin-right:auto;line-height:1.6;">${escapeHtml(body.slice(0, 300))}</p>` : ""}
        <div style="display:flex;align-items:center;justify-content:center;gap:16px;">
          <a href="#" style="padding:12px 28px;border-radius:8px;background:linear-gradient(135deg,${colors.primary},${colors.secondary});color:white;font-weight:600;font-size:14px;text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Get Started</a>
          <a href="#" style="padding:12px 28px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);color:#d4d4d8;font-size:14px;text-decoration:none;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">Learn More</a>
        </div>
      </div>
    </section>`;
}

function renderSections(page: ScrapedPage, colors: ReturnType<typeof getColors>): string {
  return page.sections.slice(0, 6).map((section, i) => {
    const text = section.text.trim();
    if (text.length < 10) return "";

    // Check if this looks like a feature/card section
    const sentences = text.split(/\.\s+/).filter(s => s.length > 10);

    if (sentences.length >= 3) {
      // Grid of features
      const cards = sentences.slice(0, 3).map(s => `
        <div style="padding:24px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:border-color 0.2s;" onmouseover="this.style.borderColor='${colors.primary}40'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
          <div style="width:40px;height:40px;border-radius:8px;background:${colors.primary}20;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
            <span style="color:${colors.primary};font-size:18px;">✦</span>
          </div>
          <p style="font-size:14px;color:#d4d4d8;line-height:1.6;">${escapeHtml(s.slice(0, 150))}${s.length > 150 ? "..." : ""}</p>
        </div>
      `).join("");

      return `
        <section style="padding:60px 24px;">
          <div style="max-width:1000px;margin:0 auto;">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;">
              ${cards}
            </div>
          </div>
        </section>`;
    }

    // Regular content section
    return `
      <section style="padding:48px 24px;${i % 2 === 1 ? "background:rgba(255,255,255,0.02);" : ""}">
        <div style="max-width:700px;margin:0 auto;">
          <p style="font-size:15px;color:#a1a1aa;line-height:1.8;">${escapeHtml(text.slice(0, 500))}${text.length > 500 ? "..." : ""}</p>
        </div>
      </section>`;
  }).filter(Boolean).join("");
}

function renderImages(page: ScrapedPage): string {
  const images = page.images.slice(0, 4);
  if (images.length === 0) return "";

  return `
    <section style="padding:40px 24px;">
      <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">
        ${images.map(img => `
          <div style="aspect-ratio:16/10;border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02));overflow:hidden;border:1px solid rgba(255,255,255,0.05);">
            <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />
          </div>
        `).join("")}
      </div>
    </section>`;
}

function renderFooter(scraped: ScrapedSite, colors: ReturnType<typeof getColors>): string {
  const brand = scraped.pages[0]?.title || scraped.rootDomain;
  return `
    <footer style="padding:32px 24px;border-top:1px solid rgba(255,255,255,0.05);">
      <div style="max-width:1000px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:13px;color:#52525b;">&copy; 2024 ${escapeHtml(brand)}. All rights reserved.</span>
        <div style="display:flex;gap:16px;">
          <a href="#" style="font-size:13px;color:#52525b;text-decoration:none;">Privacy</a>
          <a href="#" style="font-size:13px;color:#52525b;text-decoration:none;">Terms</a>
        </div>
      </div>
    </footer>`;
}

export function generateReactPreview(
  files: Array<{ path: string; content: string; type: string }>,
  projectName?: string
): string {
  // Find the main page component
  const pageFiles = files.filter(f =>
    f.path.match(/src\/app\/(page\.tsx|page\.jsx|layout\.tsx|layout\.jsx)$/) ||
    f.path.match(/src\/pages\/(index\.tsx|index\.jsx)$/) ||
    f.path.match(/pages\/(index\.tsx|index\.jsx)$/)
  );

  // Find all page routes
  const routeFiles = files.filter(f =>
    f.path.match(/src\/app\/.*\/page\.(tsx|jsx)$/) ||
    f.path.match(/src\/pages\/.*\.(tsx|jsx)$/)
  );

  // Extract component names from imports
  const componentFiles = files.filter(f =>
    f.path.match(/src\/components\/.*\.(tsx|jsx)$/)
  );

  // Build a simple HTML preview
  const routes = routeFiles.map(f => {
    const match = f.path.match(/src\/app\/(.+)\/page\.(tsx|jsx)$/);
    if (match) {
      const route = match[1].replace(/\/page$/, "").replace(/\(.*\)\//, "").replace(/\//g, "/");
      return route === "page" ? "/" : `/${route}`;
    }
    return null;
  }).filter(Boolean);

  // Extract text content from TSX/JSX
  function extractText(content: string): string {
    return content
      .replace(/import\s+.*from\s+["'].*["'];?/g, "")
      .replace(/export\s+(default\s+)?(function|const)\s+\w+.*?\{/, "")
      .replace(/className\s*=\s*["'][^"']*["']/g, "")
      .replace(/<[A-Z]\w+[^>]*\/?>/g, "")
      .replace(/<\/[A-Z]\w+>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\{[^}]*\}/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  }

  const mainPage = pageFiles[0];
  const mainContent = mainPage ? extractText(mainPage.content) : "";
  const title = projectName || "Generated Project";

  // Get Tailwind-like colors from components
  const allContent = files.map(f => f.content).join(" ");
  const bgMatch = allContent.match(/bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/);
  const textMatch = allContent.match(/text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)/);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="bg-zinc-950 text-white min-h-screen">
  <nav class="flex items-center justify-between px-8 py-4 border-b border-zinc-800">
    <div class="text-xl font-bold">${escapeHtml(title)}</div>
    <div class="flex gap-6 text-sm text-zinc-400">
      ${routes.filter(Boolean).map(r => `<a href="#" class="hover:text-white transition-colors">${r === "/" ? "Home" : r!.replace(/^\//, "").replace(/\//g, " / ")}</a>`).join("\n      ")}
    </div>
  </nav>
  <main class="max-w-6xl mx-auto px-8 py-16">
    <h1 class="text-5xl font-bold mb-6 bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">${escapeHtml(title)}</h1>
    <p class="text-xl text-zinc-400 mb-12 max-w-2xl">${mainContent ? escapeHtml(mainContent.slice(0, 200)) : "Generated project preview"}</p>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${routes.filter(r => r !== "/").map(r => `
      <div class="p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
        <h3 class="text-lg font-semibold mb-2">${escapeHtml(r?.replace(/^\//, "").replace(/\//g, " / ") || "Page")}</h3>
        <p class="text-sm text-zinc-500">View ${escapeHtml(r?.replace(/^\//, "") || "page")}</p>
      </div>`).join("")}
      ${componentFiles.slice(0, 3).map(f => {
        const name = f.path.match(/components\/(.+)\.(tsx|jsx)$/)?.[1] || "Component";
        return `
      <div class="p-6 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors">
        <h3 class="text-lg font-semibold mb-2">${escapeHtml(name)}</h3>
        <p class="text-sm text-zinc-500">Component</p>
      </div>`;
      }).join("")}
    </div>
    <div class="mt-12 p-6 rounded-xl bg-zinc-900 border border-zinc-800">
      <h3 class="text-lg font-semibold mb-4">Project Structure</h3>
      <div class="text-sm text-zinc-500 font-mono">
        ${files.slice(0, 15).map(f => `<div class="py-0.5">${escapeHtml(f.path)}</div>`).join("")}
        ${files.length > 15 ? `<div class="py-0.5 text-zinc-600">... and ${files.length - 15} more files</div>` : ""}
      </div>
    </div>
  </main>
</body>
</html>`;
}

export function generatePreviewHtml(scraped: ScrapedSite | null | undefined, projectName?: string): string {
  if (!scraped || scraped.pages.length === 0) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>body{margin:0;background:#09090b;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;}</style>
</head><body><div style="text-align:center;color:#71717a;"><p>Preview requires scraped data</p></div></body></html>`;
  }

  const colors = getColors(scraped);
  const homePage = scraped.pages.find(p => p.path === "/") || scraped.pages[0];

  // Build page sections
  const nav = renderNav(scraped, colors);
  const hero = renderHero(scraped, colors);
  const sections = renderSections(homePage, colors);
  const images = renderImages(homePage);
  const footer = renderFooter(scraped, colors);

  // Additional pages as links section
  const otherPages = scraped.pages.filter(p => p.path !== "/").slice(0, 4);
  let pagesSection = "";
  if (otherPages.length > 0) {
    pagesSection = `
      <section style="padding:60px 24px;background:rgba(255,255,255,0.02);">
        <div style="max-width:1000px;margin:0 auto;">
          <h2 style="font-size:24px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Explore</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
            ${otherPages.map(p => `
              <div style="padding:20px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
                <h3 style="font-size:15px;font-weight:600;color:white;margin-bottom:8px;">${escapeHtml(p.title || p.path)}</h3>
                <p style="font-size:13px;color:#71717a;line-height:1.5;">${escapeHtml((p.description || p.bodyText || "").slice(0, 100))}${(p.description || p.bodyText || "").length > 100 ? "..." : ""}</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(projectName || homePage.title || "Preview")}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${colors.bg};
      color: ${colors.text};
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    a { text-decoration: none; }
    img { max-width: 100%; height: auto; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  </style>
</head>
<body>
  ${nav}
  ${hero}
  ${sections}
  ${images}
  ${pagesSection}
  ${footer}
</body>
</html>`;
}
