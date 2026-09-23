"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Order = {
  id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  created_at: string;
};

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      const [{ data: profile }, { data: customer }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("customers").select("full_name").eq("user_id", user.id).maybeSingle(),
      ]);
      const { data: orderRows } = await supabase
        .from("orders")
        .select("id,status,payment_status,total_amount,currency,created_at")
        .order("created_at", { ascending: false });
      if (!active) return;
      setEmail(user.email ?? "");
      setName(profile?.full_name || customer?.full_name || user.user_metadata?.full_name || "");
      setOrders(orderRows ?? []);
      setLoading(false);
    }
    loadAccount();
    return () => { active = false; };
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }


  if (loading) {
    return <section className="section"><div className="container"><p className="section-copy">Loading your account...</p></div></section>;
  }

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">MY ACCOUNT</span>
            <h1 className="section-title">Welcome{name ? ", " + name : ""}.</h1>
            <p className="section-copy">{email}</p>
          </div>
          <Link href="/account/settings" className="button button-secondary">Account Settings</Link>
        </div>
        <div className="account-grid">
          <div className="account-card">
            <span className="eyebrow">PROFILE</span>
            <h2>Your account</h2>
            <p>Account email</p>
            <strong>{email}</strong>
            <Link href="/shop" className="button button-primary">Continue Shopping</Link>
          </div>
          <div className="account-card">
            <span className="eyebrow">SETTINGS</span>
            <h2>Manage your account</h2>
            <p>Update your profile, sign out, or permanently close your UTECH account from one secure settings page.</p>
            <Link href="/account/settings" className="button button-secondary">Open Account Settings</Link>
          </div>
          <div className="account-card account-orders">
            <div className="account-card-heading">
              <div><span className="eyebrow">ORDERS</span><h2>Order history</h2></div>
              <span>{orders.length} order{orders.length === 1 ? "" : "s"}</span>
            </div>
            {orders.length ? (
              <div className="order-list">
                {orders.map((order) => (
                  <article className="order-row" key={order.id}>
                    <div><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><span>{new Date(order.created_at).toLocaleDateString()}</span></div>
                    <div><span className="order-status">{order.status}</span><strong>{order.currency} {Number(order.total_amount).toFixed(2)}</strong></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-results"><h3>No orders yet.</h3><p>Your UTECH orders will appear here after checkout.</p><Link href="/shop" className="button button-primary">Shop Now</Link></div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
