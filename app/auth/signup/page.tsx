"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    if (data.session && data.user) {
      await supabase.from("profiles").upsert({ id: data.user.id, full_name: name }, { onConflict: "id" });
      router.push("/account");
      router.refresh();
      return;
    }
    setMessage("Account created. Check your email to confirm your account, then sign in.");
    setLoading(false);
  }

  return (
    <section className="section auth-section">
      <div className="container auth-container">
        <div className="auth-card">
          <span className="eyebrow">JOIN UTECH</span>
          <h1>Create your account.</h1>
          <p>Keep your orders and customer details connected to one secure account.</p>
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your full name" /></label>
            <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" /></label>
            <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="At least 6 characters" /></label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-success" role="status">{message}</p>}
            <button className="button button-primary" type="submit" disabled={loading}>{loading ? "Creating account..." : "Create Account"}</button>
          </form>
          <p className="auth-switch">Already have an account? <Link href="/auth/login">Sign in</Link></p>
        </div>
      </div>
    </section>
  );
}
