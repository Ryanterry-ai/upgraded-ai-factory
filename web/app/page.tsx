import Link from "next/link";
import { Button } from "../components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Upgraded AI Factory
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Multi-factory AI platform that generates production-ready Next.js applications
          from natural language prompts. Powered by 7 factories, 32 agents, and
          self-improving intelligence.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
