import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function isAdminEmail(email?: string | null) {
  const allowed = (process.env.UTECH_ADMIN_EMAILS ?? "").split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  return !!email && allowed.includes(email.toLowerCase());
}

export default async function ContactMessagesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const email = data?.claims?.email as string | undefined;

  if (!userId) redirect("/auth/login?next=/admin/marketplace/messages");
  if (!isAdminEmail(email)) redirect("/admin/marketplace");

  const admin = getSupabaseAdmin();
  const { data: messages, error } = await admin
    .from("contact_messages")
    .select("id, name, email, topic, message, status, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <section className="section account-section">
      <div className="container">
        <div className="account-header">
          <div>
            <span className="eyebrow">UTECH ADMIN</span>
            <h1 className="section-title">Contact inbox.</h1>
            <p className="section-copy">Review support requests submitted through the public UTECH Marketplace contact page.</p>
          </div>
          <a className="button button-secondary" href="/admin/marketplace">Back to Marketplace Control</a>
        </div>

        {error ? (
          <div className="account-card"><p className="auth-error">{error.message}</p></div>
        ) : messages?.length ? (
          <div className="seller-orders-list">
            {messages.map((message) => (
              <article className="seller-order-card" key={message.id}>
                <div className="seller-order-card-header">
                  <div>
                    <strong>{message.name}</strong>
                    <span>{message.email} · {new Date(message.created_at).toLocaleString()}</span>
                  </div>
                  <div className="seller-order-badges">
                    <span className="seller-payout-status seller-payout-status-eligible">{message.topic.replace("_", " ")}</span>
                    <span className="seller-fulfillment-status">{message.status}</span>
                  </div>
                </div>
                <p className="section-copy" style={{ marginTop: 0 }}>{message.message}</p>
                <div className="admin-review-actions">
                  {(["new", "in_progress", "resolved", "spam"] as const).map((status) => (
                    <form action="/api/admin/marketplace/contact" method="post" key={status}>
                      <input type="hidden" name="messageId" value={message.id} />
                      <input type="hidden" name="status" value={status} />
                      <button className={status === message.status ? "button button-primary" : "button button-secondary"} type="submit">{status.replace("_", " ")}</button>
                    </form>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="account-card"><p className="empty">No contact messages yet.</p></div>
        )}
      </div>
    </section>
  );
}
