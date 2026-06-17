/**
 * Generates a standalone HTML preview from generated project files.
 * Extracts content from React components and renders as static HTML
 * so the iframe can show the site immediately without a dev server.
 */

interface GeneratedFile {
  path: string;
  content: string;
  type: string;
}

function extractJsxContent(jsx: string): string {
  // Simple JSX to HTML converter for preview purposes
  let html = jsx;
  // Remove imports/exports
  html = html.replace(/import\s+.*?from\s+["'].*?["'];?\n/g, "");
  html = html.replace(/export\s+default\s+/g, "");
  html = html.replace(/export\s+(?:function|const)\s+\w+\s*(?:=\s*)?\(?.*?\)?\s*=>\s*/g, "");
  html = html.replace(/export\s+function\s+\w+\s*\(.*?\)\s*\{?\s*/g, "");
  // Convert className to class
  html = html.replace(/className=/g, "class=");
  // Convert JSX expressions to text
  html = html.replace(/\{`([^`]+)`\}/g, "$1");
  html = html.replace(/\{"([^"]+)"\}/g, "$1");
  html = html.replace(/\{([^}]+)\}/g, "");
  // Remove fragment wrappers
  html = html.replace(/<>\s*/g, "");
  html = html.replace(/\s*<\/>/g, "");
  // Remove trailing return and braces
  html = html.replace(/[\s\S]*?return\s*\(/, "");
  html = html.replace(/\);\s*\}?\s*$/, "");
  return html.trim();
}

function extractTailwindClasses(content: string): string {
  // Extract custom colors from tailwind config
  const colorMatch = content.match(/colors:\s*\{([^}]+)\}/);
  const colors: Record<string, string> = {};
  if (colorMatch) {
    const pairs = colorMatch[1].match(/(\w+):\s*["']([^"']+)["']/g);
    if (pairs) {
      for (const pair of pairs) {
        const [key, val] = pair.split(":").map((s) => s.trim().replace(/["']/g, ""));
        colors[key] = val;
      }
    }
  }
  return Object.entries(colors)
    .map(([k, v]) => `--color-${k}: ${v};`)
    .join("\n    ");
}

function extractCssContent(content: string): string {
  // Extract CSS custom properties and styles from globals.css
  let css = content;
  // Remove @tailwind directives
  css = css.replace(/@tailwind\s+.*?;/g, "");
  // Extract CSS variables
  const vars: string[] = [];
  const varMatches = css.match(/--[\w-]+:\s*[^;]+;/g);
  if (varMatches) vars.push(...varMatches);
  return vars.join("\n    ");
}

function extractComponentText(content: string): string {
  // Extract text content from JSX components
  const texts: string[] = [];
  // String literals in JSX
  const strMatches = content.match(/["']([^"']{10,})["']/g);
  if (strMatches) {
    for (const s of strMatches) {
      const text = s.replace(/["']/g, "");
      if (!text.includes("className") && !text.includes("http") && !text.includes("/")) {
        texts.push(text);
      }
    }
  }
  return texts.join(" ");
}

function extractColors(content: string): { primary: string; secondary: string; accent: string } {
  const colors = { primary: "#7c3aed", secondary: "#ec4899", accent: "#06b6d4" };

  // Look for hex colors
  const hexMatches = content.match(/["']#[0-9a-fA-F]{6}["']/g);
  if (hexMatches && hexMatches.length >= 2) {
    colors.primary = hexMatches[0].replace(/["']/g, "");
    colors.secondary = hexMatches[1].replace(/["']/g, "");
  }
  if (hexMatches && hexMatches.length >= 3) {
    colors.accent = hexMatches[2].replace(/["']/g, "");
  }
  return colors;
}

export function generatePreviewHtml(files: GeneratedFile[], projectName?: string): string {
  // Find key files
  const globalsCss = files.find((f) => f.path.includes("globals.css"));
  const pageFiles = files.filter((f) => f.path.includes("/app/") && f.path.endsWith("page.tsx"));
  const componentFiles = files.filter((f) => f.path.includes("/components/") && f.type === "component");
  const tailwindConfig = files.find((f) => f.path.includes("tailwind.config"));

  const colors = globalsCss ? extractColors(globalsCss.content) : { primary: "#7c3aed", secondary: "#ec4899", accent: "#06b6d4" };
  const cssVars = globalsCss ? extractCssContent(globalsCss.content) : "";
  const twVars = tailwindConfig ? extractTailwindClasses(tailwindConfig.content) : "";

  // Build component map
  const componentMap: Record<string, string> = {};
  for (const comp of componentFiles) {
    const nameMatch = comp.path.match(/\/(\w+)\.tsx$/);
    if (nameMatch) {
      componentMap[nameMatch[1]] = comp.content;
    }
  }

  // Extract content from main page
  const mainPage = pageFiles.find((f) => f.path.endsWith("page.tsx") && f.path.includes("/app/page"));
  const pageContent = mainPage ? extractJsxContent(mainPage.content) : "";

  // Extract all text content from all components
  const allTexts: string[] = [];
  for (const comp of componentFiles) {
    const text = extractComponentText(comp.content);
    if (text) allTexts.push(text);
  }

  // Build sections from component content
  const sections: string[] = [];

  // Header component
  const headerComp = componentMap["Header"];
  if (headerComp) {
    const navItems = headerComp.match(/href=["']([^"']+)["']/g)?.map((h) => {
      const match = h.match(/href=["']([^"']+)["']/);
      return match ? match[1].replace("/", "") : "";
    }) || [];
    sections.push(`
      <nav class="flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-white/5">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[${colors.primary}] to-[${colors.secondary}] flex items-center justify-center">
            <span class="text-white text-sm font-bold">${projectName?.charAt(0)?.toUpperCase() || "P"}</span>
          </div>
          <span class="font-semibold text-white">${projectName || "Project"}</span>
        </div>
        <div class="flex items-center gap-6">
          ${navItems.map((item) => `<a href="#${item}" class="text-sm text-zinc-400 hover:text-white transition-colors">${item.charAt(0).toUpperCase() + item.slice(1)}</a>`).join("\n          ")}
        </div>
      </nav>
    `);
  }

  // Hero component
  const heroComp = componentMap["Hero"];
  if (heroComp) {
    const titleMatch = heroComp.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || heroComp.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/);
    const subtitleMatch = heroComp.match(/<p[^>]*>(.*?)<\/p>/);
    const title = titleMatch ? titleMatch[1].replace(/[{}"']/g, "").trim() : "Welcome";
    const subtitle = subtitleMatch ? subtitleMatch[1].replace(/[{}"']/g, "").trim() : "";
    sections.push(`
      <section class="relative py-32 px-6 text-center overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-[${colors.primary}]/10 via-transparent to-[${colors.secondary}]/10"></div>
        <div class="relative max-w-4xl mx-auto">
          <h1 class="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">${title}</h1>
          <p class="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">${subtitle}</p>
          <div class="flex items-center justify-center gap-4">
            <a href="#" class="px-6 py-3 rounded-lg bg-gradient-to-r from-[${colors.primary}] to-[${colors.secondary}] text-white font-medium hover:opacity-90 transition-opacity">Get Started</a>
            <a href="#" class="px-6 py-3 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 transition-colors">Learn More</a>
          </div>
        </div>
      </section>
    `);
  }

  // Features component
  const featuresComp = componentMap["Features"];
  if (featuresComp) {
    const featureItems = featuresComp.match(/<h3[^>]*>([\s\S]*?)<\/h3>/g)?.map((h) => {
      return h.replace(/<[^>]+>/g, "").replace(/[{}"']/g, "").trim();
    }) || ["Feature 1", "Feature 2", "Feature 3"];
    sections.push(`
      <section class="py-20 px-6">
        <div class="max-w-6xl mx-auto">
          <h2 class="text-3xl font-bold text-white text-center mb-12">Features</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            ${featureItems.map((f, i) => `
              <div class="p-6 rounded-xl bg-white/5 border border-white/5 hover:border-[${colors.primary}]/30 transition-colors">
                <div class="w-10 h-10 rounded-lg bg-[${colors.primary}]/20 flex items-center justify-center mb-4">
                  <span class="text-[${colors.primary}] text-lg">✦</span>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2">${f}</h3>
                <p class="text-sm text-zinc-400">Built with modern technology for optimal performance and user experience.</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `);
  }

  // About component
  const aboutComp = componentMap["AboutContent"];
  if (aboutComp) {
    const aboutText = extractComponentText(aboutComp);
    sections.push(`
      <section class="py-20 px-6 bg-white/[0.02]">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-3xl font-bold text-white mb-6">About Us</h2>
          <p class="text-lg text-zinc-400 leading-relaxed">${aboutText || "We build innovative solutions for modern problems."}</p>
        </div>
      </section>
    `);
  }

  // CTA component
  const ctaComp = componentMap["CTA"];
  if (ctaComp) {
    sections.push(`
      <section class="py-20 px-6">
        <div class="max-w-4xl mx-auto text-center p-12 rounded-2xl bg-gradient-to-br from-[${colors.primary}]/10 to-[${colors.secondary}]/10 border border-white/5">
          <h2 class="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p class="text-zinc-400 mb-8">Join thousands of users building the future.</p>
          <a href="#" class="inline-block px-8 py-3 rounded-lg bg-gradient-to-r from-[${colors.primary}] to-[${colors.secondary}] text-white font-medium hover:opacity-90 transition-opacity">Start Free Trial</a>
        </div>
      </section>
    `);
  }

  // If no components found, use extracted text
  if (sections.length <= 1 && allTexts.length > 0) {
    sections.push(`
      <section class="py-20 px-6">
        <div class="max-w-4xl mx-auto">
          ${allTexts.slice(0, 5).map((t) => `<p class="text-zinc-300 mb-4">${t}</p>`).join("\n          ")}
        </div>
      </section>
    `);
  }

  // Footer
  const footerComp = componentMap["Footer"];
  if (footerComp) {
    sections.push(`
      <footer class="py-8 px-6 border-t border-white/5">
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <span class="text-sm text-zinc-500">&copy; 2024 ${projectName || "Project"}. All rights reserved.</span>
          <div class="flex items-center gap-4">
            <a href="#" class="text-sm text-zinc-500 hover:text-white transition-colors">Privacy</a>
            <a href="#" class="text-sm text-zinc-500 hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    `);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName || "Preview"}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    :root {
      ${cssVars}
      ${twVars}
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #09090b;
      color: #fff;
      min-height: 100vh;
    }
    a { text-decoration: none; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  ${sections.join("\n")}
</body>
</html>`;
}
