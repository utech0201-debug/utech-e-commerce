"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import styles from "./NotificationsPage.module.css";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login?next=/notifications");
        return;
      }
      if (!active) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("notifications")
        .select("id,type,title,message,href,read_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (active) {
        setItems(data ?? []);
        setLoading(false);
      }

      channel = supabase
        .channel(`notification-page-${user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (payload.eventType === "INSERT") setItems((current) => [payload.new as Notification, ...current]);
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Notification;
              setItems((current) => current.map((item) => item.id === next.id ? next : item));
            }
            if (payload.eventType === "DELETE") setItems((current) => current.filter((item) => item.id !== payload.old.id));
          },
        )
        .subscribe();
    }

    void load();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [router]);

  async function markAllRead() {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
  }

  async function markRead(id: string) {
    const now = new Date().toISOString();
    await supabase.from("notifications").update({ read_at: now }).eq("id", id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: now } : item));
  }

  const unread = items.filter((item) => !item.read_at).length;
  const filteredItems = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.read_at);
    if (filter === "orders") return items.filter((item) => item.type === "order");
    if (filter === "products") return items.filter((item) => item.type === "product");
    if (filter === "promotions") return items.filter((item) => item.type === "promotion");
    if (filter === "messages") return items.filter((item) => item.type === "seller_message");
    if (filter === "news") return items.filter((item) => item.type === "marketplace_news");
    return items;
  }, [filter, items]);

  const filters = [
    { id: "all", label: "All", count: items.length },
    { id: "unread", label: "Unread", count: unread },
    { id: "orders", label: "Orders", count: items.filter((item) => item.type === "order").length },
    { id: "products", label: "Products", count: items.filter((item) => item.type === "product").length },
    { id: "promotions", label: "Promotions", count: items.filter((item) => item.type === "promotion").length },
    { id: "messages", label: "Seller messages", count: items.filter((item) => item.type === "seller_message").length },
    { id: "news", label: "Marketplace news", count: items.filter((item) => item.type === "marketplace_news").length },
  ];

  if (loading) {
    return <section className="section"><div className="container"><p className="section-copy">Loading notifications...</p></div></section>;
  }

  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        <div className={styles.header}>
          <div>
            <span className="eyebrow">NOTIFICATION CENTER</span>
            <h1 className="section-title">Stay in the loop.</h1>
            <p className="section-copy">Order activity, product updates, seller messages, promotions and important UTECH Marketplace news.</p>
          </div>
          <div className={styles.actions}>
            <button className="button button-secondary" type="button" onClick={() => void markAllRead()} disabled={!unread}><CheckCheck size={17} /> Mark all read</button>
            <Link href="/account/settings#notification-preferences" className="button button-primary"><Bell size={17} /> Notification settings</Link>
          </div>
        </div>

        <div className={styles.toolbar} aria-label="Notification filters">
          {filters.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? styles.filterActive : styles.filter} onClick={() => setFilter(item.id)}>
              {item.label}<span>{item.count}</span>
            </button>
          ))}
        </div>

        <div className={styles.card}>
          {filteredItems.length ? filteredItems.map((item) => (
            <article key={item.id} className={item.read_at ? styles.row : `${styles.row} ${styles.unread}`}>
              <div className={styles.icon}><Bell size={17} /></div>
              <div className={styles.content}>
                <div className={styles.titleLine}>
                  <div><span className={styles.type}>{item.type}</span><h2>{item.title}</h2></div>
                  {!item.read_at && <span className={styles.newBadge}>NEW</span>}
                </div>
                <p>{item.message}</p>
                <time>{formatDate(item.created_at)}</time>
              </div>
              <div className={styles.rowActions}>
                {!item.read_at && <button type="button" onClick={() => void markRead(item.id)}>Mark read</button>}
                {item.href && <Link href={item.href} onClick={() => void markRead(item.id)}>View</Link>}
              </div>
            </article>
          )) : (
            <div className={styles.empty}>
              <Bell size={28} />
              <h2>{items.length ? "Nothing in this filter yet" : "No notifications yet"}</h2>
              <p>{items.length ? "Try another notification category to see more activity." : "You're all caught up. When UTECH has something important for your account, it will appear here."}</p>
              {!items.length && <Link href="/shop" className="button button-primary">Explore the marketplace</Link>}
            </div>
          )}
        </div>        </div>
      </div>
    </section>
  );
}
