export function ContentSection() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "#2563eb" }}>
          Your cart is empty Start
        </h2>
        <p className="text-gray-600 leading-relaxed">
          shopping Order note Subtotal: €0,00 Tax included, shipping and discounts calculated at checkout. Update cart Checkout Continue shopping var load = function () { if (document.querySelectorAll('.locksmith-manual-trigger').length > 0) { Locksmith.ping(); } Locksmith.util.on('submit', 'locksmith-resource-form', function (event) { event.preventDefault(); var data = Locksmith.util.serializeForm(event.target); Locksmith.postResource(data, { spinner: false, container: 'locksmith-content' }); }); Locksmi
        </p>
      </div>
    </section>
  );
}
