"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center px-4">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="w-full max-w-sm relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Check your email</h1>
          <p className="text-sm text-muted-foreground mb-6">We sent you a confirmation link.</p>
          <Link href="/login" className="text-sm text-foreground hover:underline">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center px-4">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-light to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">build.same</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start building with AI</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-500 transition-colors"
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-zinc-900 border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-500 transition-colors"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl text-sm font-medium hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
