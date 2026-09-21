"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    router.push("/account");
    router.refresh();
  }

  return (
    <section className="section auth-section">
      <div className="container auth-container">
        <div className="auth-card">
          <span className="eyebrow">UTECH ACCOUNT</span>
          <h1>Welcome back.</h1>
          <p>Sign in to view your orders and manage your UTECH account.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</button>
          </form>
          <p className="auth-switch">Don't have an account? <Link href="/auth/signup">Create one</Link></p>
        </div>
      </div>
    </section>
  );
}
