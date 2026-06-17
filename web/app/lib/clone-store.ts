/**
 * In-memory store for scraped sites per project.
 * Stores HTML pages + downloaded assets for full site clone.
 */

export interface StoredAsset {
  localPath: string;
  buffer: ArrayBuffer;
  contentType: string;
}

export interface StoredSite {
  baseUrl: string;
  rootDomain: string;
  pages: Map<string, { path: string; title: string; fullHtml: string }>;
  assets: Map<string, StoredAsset>;
  createdAt: number;
}

const store = new Map<string, StoredSite>();

const CLEANUP_AGE_MS = 60 * 60 * 1000; // 1 hour

export function storeSite(
  projectId: string,
  baseUrl: string,
  rootDomain: string,
  pages: { path: string; title: string; fullHtml: string }[],
  assets: { localPath: string; buffer: ArrayBuffer; contentType: string }[] = []
): void {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now - val.createdAt > CLEANUP_AGE_MS) store.delete(key);
  }

  const pageMap = new Map<string, { path: string; title: string; fullHtml: string }>();
  for (const p of pages) {
    if (p.fullHtml) pageMap.set(p.path, p);
  }

  const assetMap = new Map<string, StoredAsset>();
  for (const a of assets) {
    assetMap.set(a.localPath, a);
  }

  store.set(projectId, {
    baseUrl,
    rootDomain,
    pages: pageMap,
    assets: assetMap,
    createdAt: now,
  });
}

export function getSite(projectId: string): StoredSite | undefined {
  return store.get(projectId);
}

export function getPageHtml(projectId: string, path: string): string | null {
  const site = store.get(projectId);
  if (!site) return null;
  const page = site.pages.get(path);
  return page?.fullHtml ?? null;
}

export function listPages(projectId: string): { path: string; title: string }[] {
  const site = store.get(projectId);
  if (!site) return [];
  return Array.from(site.pages.values()).map(p => ({ path: p.path, title: p.title }));
}

export function getAsset(projectId: string, assetPath: string): StoredAsset | null {
  const site = store.get(projectId);
  if (!site) return null;
  return site.assets.get(assetPath) ?? null;
}

export function getSiteAssetCount(projectId: string): number {
  const site = store.get(projectId);
  if (!site) return 0;
  return site.assets.size;
}
