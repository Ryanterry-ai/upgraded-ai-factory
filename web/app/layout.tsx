import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "build.same — Build Anything With AI",
  description: "AI-native app builder with 32 agents. Describe, generate, deploy.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
