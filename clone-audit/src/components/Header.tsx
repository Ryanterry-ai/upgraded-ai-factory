"use client";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold" style={{ color: "#2563eb" }}>my-project</Link>
        <div className="hidden md:flex gap-6">
          <Link href="/proteins" className="text-sm font-medium hover:opacity-80 transition-opacity">PROTEINS</Link>
          <Link href="/pre-training" className="text-sm font-medium hover:opacity-80 transition-opacity">PRE-TRAINING</Link>
          <Link href="/build-muscle" className="text-sm font-medium hover:opacity-80 transition-opacity">BUILD MUSCLE</Link>
          <Link href="/amino-acids" className="text-sm font-medium hover:opacity-80 transition-opacity">AMINO ACIDS</Link>
          <Link href="/vitamins-minerals" className="text-sm font-medium hover:opacity-80 transition-opacity">VITAMINS & MINERALS</Link>
          <Link href="/weight-loss" className="text-sm font-medium hover:opacity-80 transition-opacity">WEIGHT LOSS</Link>
        </div>
      </nav>
    </header>
  );
}
