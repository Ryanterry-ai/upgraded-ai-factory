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
  // Use extracted header links if available, otherwise fall back to navigation
  const headerLinks = scraped.pages[0]?.components?.header?.links || [];
  const items = headerLinks.length > 0
    ? headerLinks.map(l => l.text).slice(0, 6)
    : scraped.navigation.length > 0
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

function renderProducts(page: ScrapedPage, colors: ReturnType<typeof getColors>): string {
  const products = page.products.slice(0, 6);
  if (products.length === 0) return "";

  return `
    <section style="padding:60px 24px;background:rgba(255,255,255,0.02);">
      <div style="max-width:1000px;margin:0 auto;">
        <h2 style="font-size:24px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Products</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;">
          ${products.map(product => `
            <div style="border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);overflow:hidden;transition:border-color 0.2s;" onmouseover="this.style.borderColor='${colors.primary}40'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
              ${product.image ? `<div style="aspect-ratio:1;background:rgba(255,255,255,0.05);"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" /></div>` : ""}
              <div style="padding:16px;">
                <h3 style="font-size:14px;font-weight:600;color:white;margin-bottom:8px;">${escapeHtml(product.name)}</h3>
                ${product.price ? `<p style="font-size:16px;font-weight:700;color:${colors.primary};">${escapeHtml(product.price)}</p>` : ""}
                ${product.description ? `<p style="font-size:12px;color:#71717a;margin-top:8px;line-height:1.5;">${escapeHtml(product.description.slice(0, 100))}</p>` : ""}
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>`;
}

function renderFooter(scraped: ScrapedSite, colors: ReturnType<typeof getColors>): string {
  const brand = scraped.pages[0]?.title || scraped.rootDomain;
  const footerData = scraped.pages[0]?.components?.footer;
  const footerLinks = footerData?.links?.slice(0, 6) || [];
  const socialLinks = footerData?.socialLinks || [];
  const contact = footerData?.contact;

  const linkHtml = footerLinks.length > 0
    ? footerLinks.map(l => `<a href="${escapeHtml(l.href)}" style="font-size:13px;color:#a1a1aa;text-decoration:none;transition:color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#a1a1aa'">${escapeHtml(l.text)}</a>`).join("")
    : `<a href="#" style="font-size:13px;color:#52525b;text-decoration:none;">Privacy</a>
       <a href="#" style="font-size:13px;color:#52525b;text-decoration:none;">Terms</a>`;

  const socialHtml = socialLinks.length > 0
    ? `<div style="display:flex;gap:12px;margin-top:12px;">
        ${socialLinks.slice(0, 5).map(url => {
          const name = url.includes("twitter") || url.includes("x.com") ? "Twitter" :
                       url.includes("facebook") ? "Facebook" :
                       url.includes("instagram") ? "Instagram" :
                       url.includes("linkedin") ? "LinkedIn" :
                       url.includes("youtube") ? "YouTube" :
                       url.includes("github") ? "GitHub" : "Social";
          return `<a href="${escapeHtml(url)}" style="font-size:12px;color:#71717a;text-decoration:none;">${name}</a>`;
        }).join("")}
       </div>`
    : "";

  const contactHtml = contact?.email || contact?.phone
    ? `<div style="margin-top:12px;font-size:12px;color:#52525b;">
        ${contact.email ? `<span>Email: ${escapeHtml(contact.email)}</span>` : ""}
        ${contact.phone ? ` <span>Phone: ${escapeHtml(contact.phone)}</span>` : ""}
       </div>`
    : "";

  return `
    <footer style="padding:32px 24px;border-top:1px solid rgba(255,255,255,0.05);">
      <div style="max-width:1000px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <span style="font-size:13px;color:#52525b;">&copy; 2024 ${escapeHtml(brand)}. All rights reserved.</span>
          ${contactHtml}
        </div>
        <div style="display:flex;gap:16px;">
          ${linkHtml}
        </div>
      </div>
      ${socialHtml}
    </footer>`;
}

export function generateReactPreview(
  files: Array<{ path: string; content: string; type: string }>,
  projectName?: string
): string {
  const title = projectName || "Generated Project";

  // Extract component content for realistic preview rendering
  const componentFiles = files.filter(f =>
    f.path.match(/src\/components\/.*\.(tsx|jsx)$/)
  );

  const routeFiles = files.filter(f =>
    f.path.match(/src\/app\/.*\/page\.(tsx|jsx)$/) ||
    f.path.match(/src\/pages\/.*\.(tsx|jsx)$/)
  );

  // Extract section blocks from component files for rendering
  const sections: string[] = [];
  const navLinks: string[] = [];

  for (const comp of componentFiles) {
    const name = comp.path.match(/components\/(.+)\.(tsx|jsx)$/)?.[1] || "";
    const content = comp.content;

    // Extract heading text from h1/h2 tags
    const headings = [...content.matchAll(/<(?:h[12])[^>]*>([^<]+)</g)].map(m => m[1].trim());

    // Extract button/CTA text
    const buttons = [...content.matchAll(/<(?:button|a)[^>]*>\s*([A-Z][^<]{2,30})\s*</g)].map(m => m[1].trim());

    // Extract paragraph/description text (from JSX text content, not template literals)
    const paragraphs = [...content.matchAll(/<(?:p|span)[^>]*className="[^"]*text-(?:gray|zinc|slate)[^"]*"[^>]*>([^<]{10,})</g)].map(m => m[1].trim());

    // Extract data items (from arrays in the content)
    const dataItems = [...content.matchAll(/\{\s*(?:id|name|title|label)\s*:\s*["']([^"']+)["']/g)].map(m => m[1]);

    // Extract prices
    const prices = [...content.matchAll(/\$\{?["']?\$?(\d+[\d,.]*)/g)].map(m => m[1]);

    // Build section HTML based on component type
    if (name === "Hero" || name === "hero") {
      const h1 = headings[0] || title;
      const sub = paragraphs[0] || "Built with modern technologies for optimal performance.";
      const cta = buttons[0] || "Get Started";
      sections.push(`
        <section style="position:relative;padding:80px 24px;text-align:center;overflow:hidden;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(236,72,153,0.05));">
          <div style="max-width:800px;margin:0 auto;">
            <h1 style="font-size:clamp(32px,5vw,52px);font-weight:800;color:#fafafa;line-height:1.1;margin-bottom:20px;letter-spacing:-0.02em;">${escapeHtml(h1)}</h1>
            <p style="font-size:17px;color:#a1a1aa;margin-bottom:28px;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.6;">${escapeHtml(sub.slice(0, 200))}</p>
            <div style="display:flex;align-items:center;justify-content:center;gap:14px;">
              <a href="#" style="padding:12px 28px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#ec4899);color:white;font-weight:600;font-size:14px;text-decoration:none;">${escapeHtml(cta)}</a>
              ${buttons[1] ? `<a href="#" style="padding:12px 28px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);color:#d4d4d8;font-size:14px;text-decoration:none;">${escapeHtml(buttons[1])}</a>` : ""}
            </div>
          </div>
        </section>`);
    } else if (name === "Features" || name === "features") {
      const featureCards = dataItems.slice(0, 6).map(item => `
        <div style="padding:24px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;margin-bottom:14px;">
            <span style="color:#818cf8;font-size:18px;">&#10022;</span>
          </div>
          <h3 style="font-size:16px;font-weight:600;color:white;margin-bottom:8px;">${escapeHtml(item)}</h3>
          <p style="font-size:14px;color:#71717a;line-height:1.5;">Feature description for ${escapeHtml(item.toLowerCase())}</p>
        </div>`).join("");
      if (featureCards) {
        sections.push(`
          <section style="padding:60px 24px;">
            <div style="max-width:1000px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Features</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">${featureCards}</div>
            </div>
          </section>`);
      }
    } else if (name === "Testimonials" || name === "testimonials") {
      const items = dataItems.slice(0, 4).map(item => `
        <div style="padding:24px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
          <p style="font-size:14px;color:#a1a1aa;line-height:1.6;margin-bottom:16px;font-style:italic;">"Great product, highly recommended!"</p>
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;">${item.charAt(0)}</div>
            <div><p style="font-size:13px;font-weight:600;color:white;">${escapeHtml(item)}</p><p style="font-size:11px;color:#52525b;">Customer</p></div>
          </div>
        </div>`).join("");
      if (items) {
        sections.push(`
          <section style="padding:60px 24px;background:rgba(255,255,255,0.01);">
            <div style="max-width:900px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Testimonials</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">${items}</div>
            </div>
          </section>`);
      }
    } else if (name === "CTA" || name === "cta") {
      const ctaText = buttons[0] || "Start Free Trial";
      sections.push(`
        <section style="padding:60px 24px;background:linear-gradient(135deg,#6366f1,#8b5cf6);">
          <div style="max-width:600px;margin:0 auto;text-align:center;">
            <h2 style="font-size:28px;font-weight:700;color:white;margin-bottom:12px;">Ready to Get Started?</h2>
            <p style="font-size:15px;color:rgba(255,255,255,0.8);margin-bottom:24px;">Join thousands of users building amazing things.</p>
            <a href="#" style="display:inline-block;padding:12px 32px;border-radius:8px;background:white;color:#6366f1;font-weight:600;font-size:14px;text-decoration:none;">${escapeHtml(ctaText)}</a>
          </div>
        </section>`);
    } else if (name === "PricingTable" || name === "Pricing") {
      const planNames = dataItems.slice(0, 3);
      const priceList = prices.slice(0, 3);
      const cards = planNames.map((plan, i) => `
        <div style="padding:28px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);text-align:center;">
          <h3 style="font-size:18px;font-weight:600;color:white;margin-bottom:8px;">${escapeHtml(plan)}</h3>
          <p style="font-size:32px;font-weight:800;color:#818cf8;margin:16px 0;">$${priceList[i] || "29"}</p>
          <ul style="list-style:none;padding:0;margin:20px 0;">
            <li style="padding:6px 0;font-size:13px;color:#a1a1aa;">Feature 1</li>
            <li style="padding:6px 0;font-size:13px;color:#a1a1aa;">Feature 2</li>
            <li style="padding:6px 0;font-size:13px;color:#a1a1aa;">Feature 3</li>
          </ul>
          <a href="#" style="display:block;padding:10px;border-radius:8px;background:#6366f1;color:white;font-weight:600;font-size:13px;text-decoration:none;">Choose Plan</a>
        </div>`).join("");
      if (cards) {
        sections.push(`
          <section style="padding:60px 24px;">
            <div style="max-width:900px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Pricing</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">${cards}</div>
            </div>
          </section>`);
      }
    } else if (name === "ContactForm") {
      sections.push(`
        <section style="padding:60px 24px;">
          <div style="max-width:500px;margin:0 auto;">
            <h2 style="font-size:28px;font-weight:700;color:white;margin-bottom:24px;">Contact Us</h2>
            <div style="display:flex;flex-direction:column;gap:14px;">
              <input type="text" placeholder="Your name" style="padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:white;font-size:14px;" />
              <input type="email" placeholder="Email address" style="padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:white;font-size:14px;" />
              <textarea rows="4" placeholder="Your message" style="padding:12px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:white;font-size:14px;resize:vertical;"></textarea>
              <button style="padding:12px;border-radius:8px;background:#6366f1;color:white;font-weight:600;font-size:14px;border:none;cursor:pointer;">Send Message</button>
            </div>
          </div>
        </section>`);
    } else if (name === "Team") {
      const members = dataItems.slice(0, 4);
      const cards = members.map(m => `
        <div style="text-align:center;">
          <div style="width:80px;height:80px;margin:0 auto 12px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(236,72,153,0.2));display:flex;align-items:center;justify-content:center;color:#818cf8;font-size:24px;font-weight:700;">${m.charAt(0)}</div>
          <p style="font-size:15px;font-weight:600;color:white;">${escapeHtml(m)}</p>
          <p style="font-size:12px;color:#71717a;">Team Member</p>
        </div>`).join("");
      if (cards) {
        sections.push(`
          <section style="padding:60px 24px;">
            <div style="max-width:800px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Our Team</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:28px;">${cards}</div>
            </div>
          </section>`);
      }
    } else if (name === "Stats") {
      const statLabels = dataItems.slice(0, 4);
      const statValues = prices.slice(0, 4);
      const cards = statLabels.map((label, i) => `
        <div style="text-align:center;">
          <p style="font-size:32px;font-weight:800;color:#818cf8;">${statValues[i] || "100+"}</p>
          <p style="font-size:13px;color:#a1a1aa;margin-top:4px;">${escapeHtml(label)}</p>
        </div>`).join("");
      if (cards) {
        sections.push(`
          <section style="padding:48px 24px;background:rgba(255,255,255,0.01);">
            <div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:24px;">${cards}</div>
          </section>`);
      }
    } else if (name === "Services") {
      const serviceNames = dataItems.slice(0, 6);
      const cards = serviceNames.map(s => `
        <div style="padding:24px;border-radius:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
          <h3 style="font-size:16px;font-weight:600;color:white;margin-bottom:8px;">${escapeHtml(s)}</h3>
          <p style="font-size:13px;color:#71717a;line-height:1.5;">Professional service tailored to your needs.</p>
        </div>`).join("");
      if (cards) {
        sections.push(`
          <section style="padding:60px 24px;">
            <div style="max-width:1000px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Our Services</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">${cards}</div>
            </div>
          </section>`);
      }
    } else if (name === "FAQ") {
      const faqs = dataItems.slice(0, 4);
      const items = faqs.map(q => `
        <div style="padding:20px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
          <p style="font-size:15px;font-weight:600;color:white;margin-bottom:8px;">${escapeHtml(q)}</p>
          <p style="font-size:13px;color:#71717a;line-height:1.5;">Answer goes here.</p>
        </div>`).join("");
      if (items) {
        sections.push(`
          <section style="padding:60px 24px;">
            <div style="max-width:700px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">FAQ</h2>
              <div style="display:flex;flex-direction:column;gap:12px;">${items}</div>
            </div>
          </section>`);
      }
    } else if (name === "BlogList") {
      const posts = dataItems.slice(0, 3);
      const cards = posts.map(p => `
        <div style="padding:20px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
          <div style="aspect-ratio:16/9;border-radius:8px;background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(236,72,153,0.1));margin-bottom:14px;"></div>
          <p style="font-size:15px;font-weight:600;color:white;">${escapeHtml(p)}</p>
          <p style="font-size:12px;color:#71717a;margin-top:4px;">Read more &rarr;</p>
        </div>`).join("");
      if (cards) {
        sections.push(`
          <section style="padding:60px 24px;">
            <div style="max-width:900px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Blog</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;">${cards}</div>
            </div>
          </section>`);
      }
    } else if (name === "Newsletter") {
      sections.push(`
        <section style="padding:48px 24px;background:rgba(255,255,255,0.02);">
          <div style="max-width:500px;margin:0 auto;text-align:center;">
            <h2 style="font-size:22px;font-weight:700;color:white;margin-bottom:12px;">Subscribe to Our Newsletter</h2>
            <div style="display:flex;gap:8px;">
              <input type="email" placeholder="Enter your email" style="flex:1;padding:10px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:white;font-size:13px;" />
              <button style="padding:10px 20px;border-radius:8px;background:#6366f1;color:white;font-weight:600;font-size:13px;border:none;">Subscribe</button>
            </div>
          </div>
        </section>`);
    } else if (name === "ProductGrid") {
      const productNames = dataItems.slice(0, 4);
      const productPrices = prices.slice(0, 4);
      const cards = productNames.map((p, i) => `
        <div style="border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
          <div style="aspect-ratio:1;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(236,72,153,0.05));display:flex;align-items:center;justify-content:center;color:#52525b;font-size:13px;">Image</div>
          <div style="padding:14px;">
            <p style="font-size:14px;font-weight:600;color:white;">${escapeHtml(p)}</p>
            <p style="font-size:16px;font-weight:700;color:#818cf8;margin-top:4px;">$${productPrices[i] || "29.99"}</p>
            <button style="margin-top:10px;width:100%;padding:8px;border-radius:6px;background:#6366f1;color:white;font-size:12px;font-weight:600;border:none;cursor:pointer;">Add to Cart</button>
          </div>
        </div>`).join("");
      if (cards) {
        sections.push(`
          <section style="padding:60px 24px;">
            <div style="max-width:1000px;margin:0 auto;">
              <h2 style="font-size:28px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Products</h2>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;">${cards}</div>
            </div>
          </section>`);
      }
    } else {
      // Generic component — render data items if any
      if (dataItems.length > 0) {
        const cards = dataItems.slice(0, 4).map(item => `
          <div style="padding:18px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);">
            <p style="font-size:14px;font-weight:600;color:white;">${escapeHtml(item)}</p>
          </div>`).join("");
        sections.push(`
          <section style="padding:40px 24px;">
            <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">${cards}</div>
          </section>`);
      }
    }
  }

  // Build navigation from Header component
  const headerFile = componentFiles.find(f => /components\/Header\.(tsx|jsx)$/.test(f.path));
  if (headerFile) {
    const linkMatches = [...headerFile.content.matchAll(/<Link[^>]*href="([^"]+)"[^>]*>([^<]+)</g)];
    for (const m of linkMatches) {
      navLinks.push(m[2].trim());
    }
  }

  // Fallback: use route names
  if (navLinks.length === 0) {
    for (const route of routeFiles) {
      const match = route.path.match(/src\/app\/(.+)\/page\.(tsx|jsx)$/);
      if (match) {
        const routeName = match[1].replace(/\(.*\)\//, "").replace(/\//g, " / ");
        navLinks.push(routeName === "page" ? "Home" : routeName.charAt(0).toUpperCase() + routeName.slice(1));
      }
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #09090b; color: #fafafa; min-height: 100vh; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
  </style>
</head>
<body>
  <nav style="display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-bottom:1px solid rgba(255,255,255,0.05);position:sticky;top:0;z-index:100;background:rgba(9,9,11,0.9);backdrop-filter:blur(12px);">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:28px;height:28px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:12px;font-weight:700;">${title.charAt(0).toUpperCase()}</span>
      </div>
      <span style="font-weight:600;font-size:13px;color:white;">${escapeHtml(title.slice(0, 20))}</span>
    </div>
    <div style="display:flex;align-items:center;gap:20px;">
      ${navLinks.map(link => `<a href="#" style="font-size:13px;color:#a1a1aa;text-decoration:none;transition:color 0.2s;" onmouseover="this.style.color='white'" onmouseout="this.style.color='#a1a1aa'">${escapeHtml(link)}</a>`).join("\n      ")}
    </div>
  </nav>
  <main>
    ${sections.join("\n")}
    ${sections.length === 0 ? `
    <div style="padding:80px 24px;text-align:center;">
      <h1 style="font-size:40px;font-weight:800;background:linear-gradient(135deg,#818cf8,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px;">${escapeHtml(title)}</h1>
      <p style="font-size:16px;color:#71717a;max-width:500px;margin:0 auto;">Project generated successfully with ${files.length} files.</p>
      <div style="margin-top:32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;max-width:800px;margin-left:auto;margin-right:auto;">
        ${files.filter(f => f.path.includes("components/")).slice(0, 6).map(f => {
          const name = f.path.match(/components\/(.+)\.(tsx|jsx)$/)?.[1] || "Component";
          return `<div style="padding:16px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);text-align:left;">
            <p style="font-size:14px;font-weight:600;color:white;">${escapeHtml(name)}</p>
            <p style="font-size:11px;color:#52525b;margin-top:4px;">${f.content.split("\\n").length} lines</p>
          </div>`;
        }).join("")}
      </div>
    </div>` : ""}
  </main>
  <footer style="padding:24px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
    <p style="font-size:12px;color:#52525b;">Generated by build.same</p>
  </footer>
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
  const products = renderProducts(homePage, colors);
  const footer = renderFooter(scraped, colors);

  // Additional pages as links section
  const otherPages = scraped.pages.filter(p => p.path !== "/").slice(0, 6);
  let pagesSection = "";
  if (otherPages.length > 0) {
    pagesSection = `
      <section style="padding:60px 24px;background:rgba(255,255,255,0.02);">
        <div style="max-width:1000px;margin:0 auto;">
          <h2 style="font-size:24px;font-weight:700;color:white;text-align:center;margin-bottom:32px;">Explore</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
            ${otherPages.map(p => `
              <div style="padding:20px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);transition:border-color 0.2s;" onmouseover="this.style.borderColor='${colors.primary}40'" onmouseout="this.style.borderColor='rgba(255,255,255,0.05)'">
                <h3 style="font-size:15px;font-weight:600;color:white;margin-bottom:8px;">${escapeHtml(p.title || p.path)}</h3>
                <p style="font-size:13px;color:#71717a;line-height:1.5;">${escapeHtml((p.description || p.bodyText || "").slice(0, 120))}${(p.description || p.bodyText || "").length > 120 ? "..." : ""}</p>
                <p style="font-size:11px;color:#52525b;margin-top:8px;">${p.images?.length || 0} images · ${p.links?.filter(l => l.isInternal).length || 0} links</p>
              </div>
            `).join("")}
          </div>
        </div>
      </section>`;
  }

  // Tech stack section
  let techSection = "";
  if (scraped.techStack && scraped.techStack.length > 0) {
    techSection = `
      <section style="padding:40px 24px;">
        <div style="max-width:1000px;margin:0 auto;text-align:center;">
          <p style="font-size:13px;color:#52525b;margin-bottom:12px;">TECHNOLOGIES DETECTED</p>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;">
            ${scraped.techStack.map(tech => `
              <span style="padding:6px 14px;border-radius:20px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:#a1a1aa;">${escapeHtml(tech)}</span>
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
  ${products}
  ${images}
  ${pagesSection}
  ${techSection}
  ${footer}
</body>
</html>`;
}
