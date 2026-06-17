export function ContentSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#2563eb" }}>
          { \"@context\": \"https://schema.org\", \"@type\": \"BreadcrumbList\",
        </h2>
        <p className="text-gray-600 leading-relaxed">
          \"itemListElement\": [ { \"@type\": \"ListItem\", \"position\": 1, \"name\": \"Home\", \"item\": \"https:\/\/needsupps.site\/\" },{ \"@type\": \"ListItem\", \"position\": 2, \"name\": \"BUILD MUSCLE\", \"item\": \"https:\/\/needsupps.site\/collections\/muscle-builder\" },{ \"@type\": \"ListItem\", \"position\": 3, \"name\": \"NEED PROTEIN MAX\", \"item\": \"https:\/\/needsupps.site\/products\/need-protein-max\" }] } Home BUILD MUSCLE NEED PROTEIN MAX Previous Previous Next Previous Next Close NEED PROTEIN MAX €57,65 Unit price / Unavailab
        </p>
      </div>
    </section>
  );
}
