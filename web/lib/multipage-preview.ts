/**
 * Multi-page preview system
 * Injects navigation interception into the homepage HTML
 * so clicking nav links loads other cloned pages.
 */

interface ScrapedPage {
  url: string;
  path: string;
  title: string;
  fullHtml?: string;
}

export function createMultiPagePreview(pages: ScrapedPage[], projectName?: string): string {
  if (pages.length === 0) return "";

  // Find the homepage
  const homePage = pages.find(p => p.path === "/") || pages[0];
  if (!homePage?.fullHtml) return "";

  // Build a page index: path -> HTML (encoded for safe embedding)
  const pageMap: Record<string, string> = {};
  for (const page of pages) {
    if (page.fullHtml) {
      pageMap[page.path] = page.fullHtml;
    }
  }

  const pagesJson = JSON.stringify(pageMap);
  const defaultPath = homePage.path;

  // Inject navigation interception script into the homepage HTML
  let html = homePage.fullHtml;

  // Remove any existing <base> tags to avoid conflicts
  html = html.replace(/<base[^>]*>/gi, "");

  // Add the navigation script before </body>
  const navScript = `
<script>
(function() {
  const PAGES = ${pagesJson};
  const DEFAULT = "${defaultPath}";

  function navigateTo(path) {
    if (!path || path === "/") path = DEFAULT;
    let html = PAGES[path];
    if (!html) {
      const keys = Object.keys(PAGES);
      const match = keys.find(k => path.startsWith(k) || k.startsWith(path));
      if (match) html = PAGES[match];
    }
    if (!html) {
      html = '<!DOCTYPE html><html><head><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:sans-serif;}</style></head><body><div style="text-align:center"><h1 style="font-size:48px;color:#ccc">404</h1><p style="color:#999">Page not cloned: ' + path + '</p><p style="margin-top:16px"><a href="#" onclick="window.__navigateTo(\\'' + DEFAULT + '\\')" style="color:#7c3aed">← Back to home</a></p></div></body></html>';
    }
    document.open();
    document.write(html);
    document.close();
    setTimeout(attachInterception, 200);
  }

  function attachInterception() {
    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http') && !href.includes(window.location.hostname)) return;
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;
      if (href.startsWith('#')) {
        e.preventDefault();
        var id = href.slice(1);
        var el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      e.preventDefault();
      var targetPath = href;
      if (href.startsWith('http')) {
        try { targetPath = new URL(href).pathname; } catch(ex) {}
      }
      window.__navigateTo(targetPath);
    }, true);
  }

  window.__navigateTo = navigateTo;
  attachInterception();
})();
</script>`;

  // Insert before </body> or at end
  if (html.includes("</body>")) {
    html = html.replace("</body>", navScript + "</body>");
  } else if (html.includes("</html>")) {
    html = html.replace("</html>", navScript + "</html>");
  } else {
    html += navScript;
  }

  return html;
}
