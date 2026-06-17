export function ContentSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#2563eb" }}>
          { \"@context\": \"https://schema.org\", \"@type\": \"BreadcrumbList\",
        </h2>
        <p className="text-gray-600 leading-relaxed">
          \"itemListElement\": [ { \"@type\": \"ListItem\", \"position\": 1, \"name\": \"Home\", \"item\": \"https:\/\/needsupps.site\/\" },{ \"@type\": \"ListItem\", \"position\": 2, \"name\": \"WEIGHT LOSS\", \"item\": \"https:\/\/needsupps.site\/collections\/weight-loss\" },{ \"@type\": \"ListItem\", \"position\": 3, \"name\": \"NEED PURE ISO\", \"item\": \"https:\/\/needsupps.site\/products\/need-pure-iso\" }] } Home WEIGHT LOSS NEED PURE ISO Previous Previous Next <div class=\"product-label-container\"><span class=\"product-label product-label--s
        </p>
      </div>
    </section>
  );
}
