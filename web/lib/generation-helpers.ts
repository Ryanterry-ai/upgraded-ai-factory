/**
 * Shared helper functions for generation pipeline and business genesis.
 * Extracted to avoid circular dependencies.
 */

const COUNTRIES = new Set(["india", "usa", "uk", "canada", "australia", "germany", "france", "japan", "china", "brazil", "nigeria", "uae", "singapore", "pakistan", "bangladesh", "nepal", "sri lanka"]);
const STOP_WORDS = /^(build|create|make|design|generate|develop|a|an|the|for|with|and|that|which|premium|india|ecommerce|store|supplement|platform|website|app)$/i;

export function extractBrandName(prompt: string): string {
  if (!prompt) return "Project";
  const urlMatch = prompt.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)\.[a-zA-Z]{2,}/i);
  if (urlMatch) {
    const domain = urlMatch[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (!COUNTRIES.has(domain.toLowerCase())) return domain;
  }
  const nameMatch = prompt.match(/(?:for|called|named|titled|brand(?:ed)?\s+(?:as)?)\s+(?:a\s+)?(?:the\s+)?["']?([A-Z][A-Za-z0-9\s&]+?)["']?\s*(?:\.|,|$)/i);
  if (nameMatch) {
    const name = nameMatch[1].trim();
    if (!COUNTRIES.has(name.toLowerCase()) && name.length > 2) return name;
  }
  const firstLine = prompt.split(/[.\n]/)[0].trim();
  const words = firstLine.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.test(w) && !COUNTRIES.has(w.toLowerCase()));
  if (words.length > 0) return words.slice(0, 3).join(" ").replace(/\b\w/g, c => c.toUpperCase());
  return "NutriStore";
}

export function extractProjectContext(prompt: string): Record<string, string> {
  const lower = prompt.toLowerCase();
  const context: Record<string, string> = {};

  if (/\b(gym|fitness|health|wellness)\b/.test(lower)) {
    context.serviceType = "fitness";
    context.industry = "health & fitness";
  } else if (/\b(marketing|agency|digital)\b/.test(lower)) {
    context.serviceType = "marketing";
    context.industry = "digital marketing";
  } else if (/\b(saas|software|tech)\b/.test(lower)) {
    context.serviceType = "software";
    context.industry = "technology";
  } else if (/\b(ecommerce|shop|store)\b/.test(lower)) {
    context.serviceType = "product";
    context.industry = "ecommerce";
  } else {
    context.serviceType = "professional";
    context.industry = "business";
  }

  const nameMatch = prompt.match(/(?:for|called|named)\s+(?:a\s+)?(?:the\s+)?["']?([^"'.]+?)["']?\s*(?:\.|,|$)/i);
  if (nameMatch) {
    context.projectName = nameMatch[1].trim();
  }

  return context;
}

export function extractProjectName(prompt: string, explicitName?: string): string {
  if (explicitName) return sanitizeName(explicitName);
  const explicitMatch = prompt.match(/(?:called?|named?|titled?|for)\s+["']?([A-Z][^"'.]+)["']?/i);
  if (explicitMatch) {
    const name = sanitizeName(explicitMatch[1]);
    if (!COUNTRIES.has(name.toLowerCase()) && name !== "my-project") return name;
  }
  const brandMatch = prompt.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:website|app|platform|system|site|store|shop)/i);
  if (brandMatch) {
    const name = sanitizeName(brandMatch[1]);
    if (!COUNTRIES.has(name.toLowerCase())) return name;
  }
  const typeMatch = prompt.match(/(?:a|an|the)\s+(?:modern\s+|professional\s+|creative\s+)?(\w+(?:\s+\w+)?)\s+(?:website|app|platform|agency|business|company|store|shop|system|project)/i);
  if (typeMatch) return sanitizeName(typeMatch[1]);
  return sanitizeName(extractBrandName(prompt));
}

export function sanitizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 40) || "my-project";
}
