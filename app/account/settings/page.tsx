"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Save, ShieldAlert, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import styles from "./SettingsPage.module.css";

export default function AccountSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login?next=/account/settings");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      const currentName = profile?.full_name || user.user_metadata?.full_name || "";
      setEmail(user.email ?? "");
      setName(currentName);
      setInitialName(currentName);
      setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, [router]);

  async function saveProfile() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 120) {
      setError("Name must be between 2 and 120 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: trimmed }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "We could not update your profile.");
      setSaving(false);
      return;
    }

    setName(trimmed);
    setInitialName(trimmed);
    setMessage("Profile updated successfully.");
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function deleteAccount() {
    if (confirmation !== "DELETE") {
      setError("Type DELETE to confirm account deletion.");
      return;
    }

    setDeleting(true);
    setError("");

    const response = await fetch("/api/account/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      setError(result?.error ?? "Account deletion failed. Please try again.");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <section className="section"><div className="container"><p className="section-copy">Loading your settings...</p></div></section>;
  }

  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <span className="eyebrow">ACCOUNT SETTINGS</span>
            <h1 className="section-title">Your account, your controls.</h1>
            <p className="section-copy">Manage your profile, session and account lifecycle from one place.</p>
          </div>
          <Link href="/account" className="button button-secondary">Back to account</Link>
        </div>

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <div className={styles.icon}><UserRound size={19} /></div>
              <div><span className="eyebrow">PROFILE</span><h2>Personal information</h2></div>
            </div>
            <label>
              Full name
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} autoComplete="name" />
            </label>
            <label>
              Email address
              <input value={email} readOnly aria-readonly="true" />
              <span className={styles.help}>Your sign-in email is managed by your authentication account.</span>
            </label>
            {message && <p className={styles.success}>{message}</p>}
            {error && <p className="auth-error">{error}</p>}
            <button className="button button-primary" type="button" onClick={() => void saveProfile()} disabled={saving || name.trim() === initialName}>
              <Save size={17} /> {saving ? "Saving..." : "Save profile"}
            </button>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <div className={styles.icon}><LogOut size={19} /></div>
              <div><span className="eyebrow">SESSION</span><h2>Sign out</h2></div>
            </div>
            <p>Sign out of your UTECH account on this device. You can sign in again whenever you need to.</p>
            <button className="button button-secondary" type="button" onClick={() => void signOut()}>Sign Out</button>
          </section>

          <section className={`${styles.card} ${styles.danger}`}>
            <div className={styles.cardHeading}>
              <div className={styles.dangerIcon}><ShieldAlert size={19} /></div>
              <div><span className="eyebrow">DANGER ZONE</span><h2>Delete account</h2></div>
            </div>
            <p>Deleting your account is permanent. Some completed order, seller, financial or marketplace records may need to be retained for operational or legal reasons.</p>
            {!deleteOpen ? (
              <button className="button button-danger" type="button" onClick={() => { setDeleteOpen(true); setError(""); }}>
                Delete my account
              </button>
            ) : (
              <div className={styles.confirm}>
                <strong>This action cannot be undone.</strong>
                <span>Type <b>DELETE</b> below to confirm.</span>
                <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="DELETE" autoComplete="off" spellCheck={false} />
                {error && <p className="auth-error">{error}</p>}
                <div className={styles.actions}>
                  <button className="button button-secondary" type="button" onClick={() => { setDeleteOpen(false); setConfirmation(""); setError(""); }} disabled={deleting}>Cancel</button>
                  <button className="button button-danger" type="button" onClick={() => void deleteAccount()} disabled={deleting || confirmation !== "DELETE"}>
                    {deleting ? "Deleting..." : "Permanently delete"}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
