"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import styles from "./NotificationBell.module.css";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("notifications")
        .select("id,type,title,message,href,read_at,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (active) setItems(data ?? []);

      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setItems((current) => [payload.new as Notification, ...current].slice(0, 8));
            } else if (payload.eventType === "UPDATE") {
              const next = payload.new as Notification;
              setItems((current) => current.map((item) => item.id === next.id ? next : item));
            } else if (payload.eventType === "DELETE") {
              setItems((current) => current.filter((item) => item.id !== payload.old.id));
            }
          },
        )
        .subscribe();
    }

    void load();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  const unread = items.filter((item) => !item.read_at).length;

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  async function markAllRead() {
    if (!userId || unread === 0) return;
    const now = new Date().toISOString();
    await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
  }

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className="icon-button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={19} />
        {unread > 0 && <span className={styles.badge}>{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className="eyebrow">NOTIFICATIONS</span>
              <h3>Activity</h3>
            </div>
            <button type="button" onClick={() => void markAllRead()} disabled={!unread} title="Mark all as read">
              <CheckCheck size={16} />
              Read all
            </button>
          </div>

          <div className={styles.list}>
            {items.length ? items.map((item) => (
              <div key={item.id} className={item.read_at ? styles.item : `${styles.item} ${styles.unread}`}>
                <button type="button" className={styles.itemButton} onClick={() => void markRead(item.id)}>
                  <span className={styles.dot} />
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.message}</small>
                    <em>{relativeTime(item.created_at)}</em>
                  </span>
                </button>
                {item.href && <Link href={item.href} onClick={() => { void markRead(item.id); setOpen(false); }}>View</Link>}
              </div>
            )) : (
              <div className={styles.empty}>
                <Bell size={22} />
                <strong>You're all caught up.</strong>
                <span>New order, product and marketplace activity will appear here.</span>
              </div>
            )}
          </div>

          <Link href="/notifications" className={styles.footerLink} onClick={() => setOpen(false)}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
