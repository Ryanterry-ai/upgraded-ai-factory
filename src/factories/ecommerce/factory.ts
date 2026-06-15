import { Factory } from '../../core/engine.js';
import type { FactoryConfig, FactoryResult, StudioInput, EngineConfig, Blueprint, GeneratedFile } from '../../core/types.js';
import { processInput } from '../../inputs/index.js';
import { generatePage, generateLayout, generateStyles, generateConfig, generatePackageJson, generateTsConfig, generateTailwindConfig, generatePostcssConfig } from '../../generators/codegen.js';

export class EcommerceFactory extends Factory {
  readonly config: FactoryConfig = {
    name: 'Ecommerce Factory',
    type: 'ecommerce',
    description: 'Generates ecommerce stores with product catalogs, carts, and checkout',
    supportedInputs: ['prompt', 'url', 'screenshot', 'figma'],
    outputFormats: ['nextjs'],
    version: '0.1.0',
  };

  canHandle(input: StudioInput): boolean {
    if (input.url) {
      const lower = input.url.toLowerCase();
      return /shop|store|product|cart|checkout|buy|purchase/i.test(lower);
    }
    if (input.prompt) {
      const lower = input.prompt.toLowerCase();
      return /shop|store|product|cart|checkout|ecommerce|e-commerce|buy|purchase|stripe|pricing|catalog/i.test(lower);
    }
    return false;
  }

  async execute(input: StudioInput, config: EngineConfig): Promise<FactoryResult> {
    const startTime = Date.now();
    const files: GeneratedFile[] = [];

    const processed = await processInput(input);
    const blueprint = this.buildBlueprint(processed.prompt, processed.metadata);
    const projectName = blueprint.project.name;

    files.push(...this.generateProjectFiles(blueprint));

    if (!config.dryRun) {
      const fs = await import('fs');
      const path = await import('path');
      const outDir = path.join(config.outputDir, projectName);
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      for (const file of files) {
        const filePath = path.join(outDir, file.path);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, file.content);
      }
      await this.writeBlueprint(blueprint, config.outputDir, projectName);
    }

    return this.createResult(true, 'ecommerce', config.outputDir, files, blueprint, startTime, input.url ? 'url' : 'prompt');
  }

  private buildBlueprint(prompt: string, metadata: Record<string, unknown>): Blueprint {
    const name = this.extractName(prompt);

    return this.createBlueprint({
      project: { name, description: prompt.slice(0, 200), framework: 'nextjs', styling: 'tailwind', language: 'typescript', generatedAt: new Date().toISOString(), version: '0.1.0' },
      pages: [
        { path: '/', name: 'Home', description: 'Store homepage', components: ['Header', 'Hero', 'FeaturedProducts', 'Footer'], isPrimary: true },
        { path: '/products', name: 'Products', description: 'Product listing', components: ['Header', 'ProductGrid', 'Filters', 'Footer'], isPrimary: false },
        { path: '/products/[id]', name: 'ProductDetail', description: 'Product detail', components: ['Header', 'ProductInfo', 'AddToCart', 'Footer'], isPrimary: false },
        { path: '/cart', name: 'Cart', description: 'Shopping cart', components: ['Header', 'CartItems', 'CartSummary', 'Footer'], isPrimary: false },
        { path: '/checkout', name: 'Checkout', description: 'Checkout', components: ['Header', 'CheckoutForm', 'OrderSummary', 'Footer'], isPrimary: false },
      ],
      components: [
        { name: 'Header', type: 'organism', tag: 'header', classes: ['header'], props: [{ name: 'cartCount', type: 'number', required: false }], variants: [], children: [], parent: null, selector: 'header' },
        { name: 'Footer', type: 'organism', tag: 'footer', classes: ['footer'], props: [], variants: [], children: [], parent: null, selector: 'footer' },
        { name: 'Hero', type: 'organism', tag: 'section', classes: ['hero'], props: [{ name: 'title', type: 'string', required: true }], variants: [], children: [], parent: null, selector: '.hero' },
        { name: 'ProductCard', type: 'molecular', tag: 'div', classes: ['product-card'], props: [{ name: 'product', type: 'Product', required: true }], variants: [], children: [], parent: null, selector: '.product-card' },
        { name: 'ProductGrid', type: 'organism', tag: 'div', classes: ['product-grid'], props: [{ name: 'products', type: 'Product[]', required: true }], variants: [], children: [], parent: null, selector: '.product-grid' },
        { name: 'CartItems', type: 'organism', tag: 'div', classes: ['cart-items'], props: [{ name: 'items', type: 'CartItem[]', required: true }], variants: [], children: [], parent: null, selector: '.cart-items' },
        { name: 'CartSummary', type: 'molecular', tag: 'div', classes: ['cart-summary'], props: [{ name: 'total', type: 'number', required: true }], variants: [], children: [], parent: null, selector: '.cart-summary' },
        { name: 'CheckoutForm', type: 'molecular', tag: 'form', classes: ['checkout-form'], props: [], variants: [], children: [], parent: null, selector: '.checkout-form' },
        { name: 'Button', type: 'atomic', tag: 'button', classes: ['btn'], props: [{ name: 'variant', type: "'primary' | 'secondary'", required: false }], variants: [{ name: 'primary', description: 'Primary' }], children: [], parent: null, selector: 'button' },
      ],
      dataModels: [
        { name: 'Product', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'name', type: 'string', required: true, unique: false }, { name: 'price', type: 'number', required: true, unique: false }, { name: 'description', type: 'string', required: false, unique: false }, { name: 'image', type: 'string', required: false, unique: false }, { name: 'category', type: 'string', required: false, unique: false }], relations: [] },
        { name: 'CartItem', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'productId', type: 'string', required: true, unique: false }, { name: 'quantity', type: 'number', required: true, unique: false }], relations: [{ type: 'one-to-many', target: 'Product', field: 'productId' }] },
        { name: 'Order', fields: [{ name: 'id', type: 'string', required: true, unique: true }, { name: 'total', type: 'number', required: true, unique: false }, { name: 'status', type: 'string', required: true, unique: false }], relations: [{ type: 'one-to-many', target: 'CartItem', field: 'items' }] },
      ],
      apiContracts: [
        { method: 'GET', path: '/api/products', description: 'List products', request: {}, response: { products: 'Product[]' } },
        { method: 'GET', path: '/api/products/[id]', description: 'Get product', request: {}, response: { product: 'Product' } },
        { method: 'POST', path: '/api/cart', description: 'Add to cart', request: { productId: 'string', quantity: 'number' }, response: { item: 'CartItem' } },
        { method: 'POST', path: '/api/checkout', description: 'Checkout', request: { items: 'CartItem[]' }, response: { order: 'Order' } },
      ],
    });
  }

  private extractName(prompt: string): string {
    const match = prompt.match(/(?:called?|named?|for)\s+["']?([A-Z][^"']+)["']?/i);
    return match?.[1] || 'My Store';
  }

  private generateProjectFiles(blueprint: Blueprint): GeneratedFile[] {
    const name = blueprint.project.name;
    return [
      { path: 'src/app/page.tsx', content: generatePage('Home', ['Header', 'Hero', 'ProductGrid', 'Footer']), type: 'page' },
      { path: 'src/app/products/page.tsx', content: generatePage('Products', ['Header', 'ProductGrid', 'Footer']), type: 'page' },
      { path: 'src/app/cart/page.tsx', content: generatePage('Cart', ['Header', 'CartItems', 'CartSummary', 'Footer']), type: 'page' },
      { path: 'src/app/checkout/page.tsx', content: generatePage('Checkout', ['Header', 'CheckoutForm', 'Footer']), type: 'page' },
      { path: 'src/app/layout.tsx', content: generateLayout(name, ''), type: 'page' },
      { path: 'src/app/globals.css', content: generateStyles(), type: 'style' },
      { path: 'src/components/ProductCard.tsx', content: this.genProductCard(), type: 'component' },
      { path: 'src/components/ProductGrid.tsx', content: this.genProductGrid(), type: 'component' },
      { path: 'src/components/CartItems.tsx', content: this.genCartItems(), type: 'component' },
      { path: 'src/components/CartSummary.tsx', content: this.genCartSummary(), type: 'component' },
      { path: 'src/components/CheckoutForm.tsx', content: this.genCheckoutForm(), type: 'component' },
      { path: 'src/lib/types.ts', content: this.genTypes(), type: 'type' },
      { path: 'src/app/api/products/route.ts', content: this.genProductsApi(), type: 'api' },
      { path: 'src/app/api/cart/route.ts', content: this.genCartApi(), type: 'api' },
      { path: 'next.config.ts', content: generateConfig(name), type: 'config' },
      { path: 'package.json', content: generatePackageJson(name), type: 'config' },
      { path: 'tsconfig.json', content: generateTsConfig(), type: 'config' },
      { path: 'tailwind.config.ts', content: generateTailwindConfig(), type: 'config' },
      { path: 'postcss.config.js', content: generatePostcssConfig(), type: 'config' },
    ];
  }

  private genProductCard(): string {
    return `import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={\`/products/\${product.id}\`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
        {product.image ? (
          <Image src={product.image} alt={product.name} width={400} height={400} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">No Image</div>
        )}
      </div>
      <h3 className="mt-4 text-sm font-medium">{product.name}</h3>
      <p className="mt-1 text-lg font-semibold">\${product.price}</p>
    </Link>
  );
}
`;
  }

  private genProductGrid(): string {
    return `import React from 'react';
import { ProductCard } from './ProductCard';

interface Product { id: string; name: string; price: number; image?: string; }

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
`;
  }

  private genCartItems(): string {
    return `import React from 'react';

interface CartItem { id: string; name: string; price: number; quantity: number; }

export function CartItems({ items }: { items: CartItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
          </div>
          <p className="font-semibold">\${(item.price * item.quantity).toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
`;
  }

  private genCartSummary(): string {
    return `import React from 'react';

export function CartSummary({ total }: { total: number }) {
  return (
    <div className="rounded-lg bg-gray-50 p-6">
      <h2 className="text-lg font-semibold">Order Summary</h2>
      <div className="mt-4 space-y-2">
        <div className="flex justify-between"><span>Subtotal</span><span>\${total.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
        <div className="border-t pt-2 flex justify-between font-semibold"><span>Total</span><span>\${total.toFixed(2)}</span></div>
      </div>
      <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Checkout</button>
    </div>
  );
}
`;
  }

  private genCheckoutForm(): string {
    return `import React from 'react';

export function CheckoutForm() {
  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" className="w-full border rounded-lg px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input type="text" className="w-full border rounded-lg px-4 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input type="text" className="w-full border rounded-lg px-4 py-2" />
      </div>
      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700">Place Order</button>
    </form>
  );
}
`;
  }

  private genTypes(): string {
    return `export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}
`;
  }

  private genProductsApi(): string {
    return `import { NextResponse } from 'next/server';

const products = [
  { id: '1', name: 'Product 1', price: 29.99, description: 'Description 1' },
  { id: '2', name: 'Product 2', price: 49.99, description: 'Description 2' },
];

export async function GET() {
  return NextResponse.json({ products });
}
`;
  }

  private genCartApi(): string {
    return `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ item: { id: Date.now().toString(), ...body } });
}
`;
  }
}
