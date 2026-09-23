import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const eventTypes = new Set(["impression", "click"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adId = typeof body.adId === "string" ? body.adId : "";
    const eventType = typeof body.eventType === "string" ? body.eventType : "";

    if (!/^[0-9a-f-]{36}$/i.test(adId) || !eventTypes.has(eventType)) {
      return NextResponse.json({ error: "Invalid ad event." }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub as string | undefined;

    const admin = getSupabaseAdmin();
    const { data: ad } = await admin
      .from("marketplace_ads")
      .select("id,status,starts_at,ends_at,daily_impression_cap,total_impression_cap")
      .eq("id", adId)
      .maybeSingle();

    if (!ad || ad.status !== "approved") {
      return NextResponse.json({ ok: true });
    }

    const now = new Date();
    if ((ad.starts_at && new Date(ad.starts_at) > now) || (ad.ends_at && new Date(ad.ends_at) <= now)) {
      return NextResponse.json({ ok: true });
    }

    if (eventType === "impression" && (ad.daily_impression_cap || ad.total_impression_cap)) {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      if (ad.daily_impression_cap) {
        const { count } = await admin
          .from("marketplace_ad_events")
          .select("id", { count: "exact", head: true })
          .eq("ad_id", adId)
          .eq("event_type", "impression")
          .gte("created_at", startOfDay.toISOString());
        if ((count ?? 0) >= ad.daily_impression_cap) return NextResponse.json({ ok: true });
      }

      if (ad.total_impression_cap) {
        const { count } = await admin
          .from("marketplace_ad_events")
          .select("id", { count: "exact", head: true })
          .eq("ad_id", adId)
          .eq("event_type", "impression");
        if ((count ?? 0) >= ad.total_impression_cap) return NextResponse.json({ ok: true });
      }
    }

    await admin.from("marketplace_ad_events").insert({
      ad_id: adId,
      user_id: userId ?? null,
      event_type: eventType,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to record ad event." }, { status: 500 });
  }
}
