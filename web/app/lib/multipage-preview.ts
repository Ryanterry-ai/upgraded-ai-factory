/**
 * Multi-page preview system
 * Uses the homepage HTML as the base and adds navigation
 * that fetches other pages on-demand via the API.
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

  // Just return the homepage HTML — navigation will be handled by
  // the workspace loading other pages on-demand
  return homePage.fullHtml;
}

export function createNavigationPreview(
  pages: ScrapedPage[],
  projectName?: string
): { homepageHtml: string; pagePaths: string[] } {
  const homePage = pages.find(p => p.path === "/") || pages[0];
  return {
    homepageHtml: homePage?.fullHtml || "",
    pagePaths: pages.filter(p => p.fullHtml).map(p => p.path),
  };
}
