/**
 * Multi-page preview system
 * Creates a wrapper HTML that embeds all scraped pages
 * and handles navigation between them.
 */

interface ScrapedPage {
  url: string;
  path: string;
  title: string;
  fullHtml?: string;
}

export function createMultiPagePreview(pages: ScrapedPage[], projectName?: string): string {
  if (pages.length === 0) return "";

  // Build a page index: path -> HTML
  const pageMap: Record<string, string> = {};
  for (const page of pages) {
    if (page.fullHtml) {
      pageMap[page.path] = page.fullHtml;
    }
  }

  // Create the wrapper HTML with embedded pages
  const pagesJson = JSON.stringify(pageMap);
  const defaultPath = pages.find(p => p.path === "/")?.path || pages[0].path;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName || "Preview"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #09090b; overflow: hidden; }
    #page-frame {
      width: 100vw;
      height: 100vh;
      border: none;
      background: white;
    }
    #loading {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090b;
      z-index: 999;
      transition: opacity 0.3s;
    }
    #loading.hidden { opacity: 0; pointer-events: none; }
    .spinner {
      width: 32px;
      height: 32px;
      border: 2px solid rgba(255,255,255,0.1);
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading"><div class="spinner"></div></div>
  <iframe id="page-frame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>

  <script>
    const PAGES = ${pagesJson};
    const DEFAULT = "${defaultPath}";
    let currentPath = null;

    function navigateTo(path) {
      // Normalize path
      if (!path || path === "/") path = DEFAULT;
      
      // Find matching page
      let html = PAGES[path];
      if (!html) {
        // Try fuzzy match
        const keys = Object.keys(PAGES);
        const match = keys.find(k => path.startsWith(k) || k.startsWith(path));
        if (match) html = PAGES[match];
      }
      
      if (!html) {
        // Page not found — show 404
        html = \`<!DOCTYPE html>
<html><head><style>
body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#09090b;color:#71717a;font-family:sans-serif;}
</style></head><body>
<div style="text-align:center">
<h1 style="font-size:48px;margin-bottom:8px;color:#3f3f46">404</h1>
<p>Page not cloned: \${path}</p>
<p style="margin-top:16px;font-size:12px;color:#52525b">
  <a href="#" onclick="navigateTo('\${DEFAULT}')" style="color:#7c3aed">← Back to home</a>
</p>
</div></body></html>\`;
      }

      // Write HTML to iframe
      const frame = document.getElementById("page-frame");
      const doc = frame.contentDocument || frame.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      // Intercept all link clicks in the iframe
      setTimeout(() => {
        try {
          const iframeDoc = frame.contentDocument || frame.contentWindow.document;
          iframeDoc.addEventListener("click", (e) => {
            const link = e.target.closest("a");
            if (!link) return;
            
            const href = link.getAttribute("href");
            if (!href) return;
            
            // Only intercept internal navigation
            if (href.startsWith("http") && !href.includes(location.hostname)) return;
            if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
            
            e.preventDefault();
            
            // Resolve path
            let targetPath = href;
            if (href.startsWith("http")) {
              try {
                targetPath = new URL(href).pathname;
              } catch {}
            }
            
            // Update browser URL hash
            window.location.hash = targetPath;
            currentPath = targetPath;
            navigateTo(targetPath);
          }, true);

          // Handle hash links within the page
          iframeDoc.addEventListener("click", (e) => {
            const hashLink = e.target.closest("a[href^='#']");
            if (hashLink) {
              e.preventDefault();
              const id = hashLink.getAttribute("href").slice(1);
              const target = iframeDoc.getElementById(id);
              if (target) target.scrollIntoView({ behavior: "smooth" });
            }
          }, true);
        } catch {}
      }, 100);

      currentPath = path;
      document.getElementById("loading").classList.add("hidden");
    }

    // Handle browser back/forward
    window.addEventListener("hashchange", () => {
      const path = window.location.hash.slice(1) || DEFAULT;
      navigateTo(path);
    });

    // Initial load
    const initialPath = window.location.hash.slice(1) || DEFAULT;
    navigateTo(initialPath);

    // Expose for parent communication
    window.navigateToPage = navigateTo;
  </script>
</body>
</html>`;
}
