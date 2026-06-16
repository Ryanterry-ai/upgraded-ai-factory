"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Error</h1>
        <p className="text-muted-foreground mb-4">Something went wrong</p>
        <button onClick={reset} className="text-sm text-foreground hover:underline">
          Try again
        </button>
      </div>
    </div>
  );
}
