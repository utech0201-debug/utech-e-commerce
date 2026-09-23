"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, LogOut, Save, ShieldAlert, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "./SettingsPage.module.css";

type Preferences = {
  order_updates: boolean;
  product_updates: boolean;
  promotions: boolean;
  seller_messages: boolean;
  marketplace_news: boolean;
  security_alerts: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
};

const defaultPreferences: Preferences = {
  order_updates: true,
  product_updates: true,
  promotions: true,
  seller_messages: true,
  marketplace_news: true,
  security_alerts: true,
  email_notifications: true,
  push_notifications: false,
};

const preferenceItems: Array<{ key: keyof Preferences; title: string; description: string }> = [
  { key: "order_updates", title: "Order updates", description: "Order confirmation, shipping, delivery and cancellation activity." },
  { key: "product_updates", title: "Product updates", description: "Stock changes, price changes and updates for products you follow." },
  { key: "promotions", title: "Promotions", description: "Deals, campaigns, discounts and marketplace promotions." },
  { key: "seller_messages", title: "Seller messages", description: "Important messages and updates from sellers you buy from." },
  { key: "marketplace_news", title: "Marketplace news", description: "New features, announcements and useful UTECH Marketplace updates." },
  { key: "security_alerts", title: "Security alerts", description: "Sign-in, account and security events. Recommended to keep enabled." },
  { key: "email_notifications", title: "Email notifications", description: "Allow eligible notifications to be delivered by email." },
  { key: "push_notifications", title: "Push notifications", description: "Allow browser/device push notifications when supported." },
];

export default function AccountSettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [initialName, setInitialName] = useState("");
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
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

      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      if (!active) return;
      const currentName = profile?.full_name || user.user_metadata?.full_name || "";
      setEmail(user.email ?? "");
      setName(currentName);
      setInitialName(currentName);
      if (prefs) {
        setPreferences({
          order_updates: prefs.order_updates,
          product_updates: prefs.product_updates,
          promotions: prefs.promotions,
          seller_messages: prefs.seller_messages,
          marketplace_news: prefs.marketplace_news,
          security_alerts: prefs.security_alerts,
          email_notifications: prefs.email_notifications,
          push_notifications: prefs.push_notifications,
        });
      }
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

  async function savePreferences() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login?next=/account/settings");
      return;
    }

    setSavingPreferences(true);
    setError("");
    setMessage("");

    const { error: saveError } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: user.id, ...preferences }, { onConflict: "user_id" });

    if (saveError) {
      setError(saveError.message || "We could not save your notification preferences.");
    } else {
      setMessage("Notification preferences saved.");
    }
    setSavingPreferences(false);
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
            <p className="section-copy">Manage your profile, notifications, sessions and account lifecycle from one place.</p>
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
            <button className="button button-primary" type="button" onClick={() => void saveProfile()} disabled={saving || name.trim() === initialName}>
              <Save size={17} /> {saving ? "Saving..." : "Save profile"}
            </button>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeading}>
              <div className={styles.icon}><Bell size={19} /></div>
              <div><span className="eyebrow">NOTIFICATIONS</span><h2>Stay informed</h2></div>
            </div>
            <p>Choose which UTECH Marketplace events you want to receive. Critical security alerts remain enabled by default.</p>
            <div className={styles.preferencePreview}>
              <span><b>{Object.values(preferences).filter(Boolean).length}</b> notification channels enabled</span>
              <Link href="#notification-preferences" className="button button-secondary">Manage preferences</Link>
            </div>
          </section>

          <section className={styles.notificationCard} id="notification-preferences">
            <div className={styles.cardHeading}>
              <div className={styles.icon}><Bell size={19} /></div>
              <div><span className="eyebrow">NOTIFICATION PREFERENCES</span><h2>Control what reaches you</h2></div>
            </div>
            <p className={styles.sectionDescription}>These settings control which categories UTECH can send through the notification system. Real-time in-app alerts can be added without changing this preference model.</p>
            <div className={styles.preferenceList}>
              {preferenceItems.map((item) => (
                <label className={styles.preferenceRow} key={item.key}>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={(event) => setPreferences((current) => ({ ...current, [item.key]: event.target.checked }))}
                    aria-label={item.title}
                  />
                </label>
              ))}
            </div>
            <button className="button button-primary" type="button" onClick={() => void savePreferences()} disabled={savingPreferences}>
              <Save size={17} /> {savingPreferences ? "Saving..." : "Save notification preferences"}
            </button>
          </section>

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className="auth-error">{error}</p>}

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
