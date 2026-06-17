import { NextRequest, NextResponse } from "next/server";
import { getPageHtml, listPages } from "@/lib/clone-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;
  const pages = listPages(projectId);

  if (pages.length === 0) {
    return new NextResponse("No pages found", { status: 404 });
  }

  // Get homepage HTML
  const homeHtml = getPageHtml(projectId, "/");
  if (!homeHtml) {
    return new NextResponse("Homepage not found", { status: 404 });
  }

  // Build navigation script that fetches pages on-demand from our API
  const navScript = `
<script>
(function() {
  const PROJECT_ID = ${JSON.stringify(projectId)};
  const API_BASE = window.location.origin;

  // Intercept all link clicks
  document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

    // Only intercept internal navigation
    let targetPath;
    try {
      const url = new URL(href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      targetPath = url.pathname;
      if (targetPath.endsWith('/') && targetPath !== '/') targetPath = targetPath.slice(0, -1);
    } catch {
      return;
    }

    e.preventDefault();

    // Fetch the target page from our API
    fetch(API_BASE + '/api/clone/page/' + PROJECT_ID + '?path=' + encodeURIComponent(targetPath))
      .then(function(r) {
        if (!r.ok) throw new Error('Page not found');
        return r.text();
      })
      .then(function(html) {
        document.open();
        document.write(html);
        document.close();
        window.history.pushState({}, '', targetPath);
      })
      .catch(function() {
        // Fallback: navigate normally
        window.location.href = href;
      });
  });

  // Handle back/forward browser navigation
  window.addEventListener('popstate', function() {
    var path = window.location.pathname;
    if (path.endsWith('/') && path !== '/') path = path.slice(0, -1);
    fetch(API_BASE + '/api/clone/page/' + PROJECT_ID + '?path=' + encodeURIComponent(path))
      .then(function(r) { return r.text(); })
      .then(function(html) {
        document.open();
        document.write(html);
        document.close();
      })
      .catch(function() {});
  });
})();
</script>`;

  // Inject navigation script before </body> or at end of HTML
  let enhancedHtml = homeHtml;
  if (enhancedHtml.includes("</body>")) {
    enhancedHtml = enhancedHtml.replace("</body>", navScript + "</body>");
  } else {
    enhancedHtml += navScript;
  }

  return new NextResponse(enhancedHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
