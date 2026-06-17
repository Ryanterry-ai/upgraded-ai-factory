export function ContentSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#2563eb" }}>
          { \"@context\": \"https://schema.org\", \"@type\": \"BreadcrumbList\",
        </h2>
        <p className="text-gray-600 leading-relaxed">
          \"itemListElement\": [ { \"@type\": \"ListItem\", \"position\": 1, \"name\": \"Home\", \"item\": \"https:\/\/needsupps.site\/\" },{ \"@type\": \"ListItem\", \"position\": 2, \"name\": \"VITAMINS \u0026 MINERALS\", \"item\": \"https:\/\/needsupps.site\/collections\/vitality-and-health\" },{ \"@type\": \"ListItem\", \"position\": 3, \"name\": \"NEED HEALTHPACK 24\/7\", \"item\": \"https:\/\/needsupps.site\/products\/need-healthpack-24-7\" }] } Home VITAMINS & MINERALS NEED HEALTHPACK 24/7 <div class=\"product-label-container\"><span class=\"pr
        </p>
      </div>
    </section>
  );
}
