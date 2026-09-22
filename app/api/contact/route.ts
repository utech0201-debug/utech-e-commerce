import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const topics = new Set(["order", "seller", "product", "account", "payment", "general"]);

function clean(value: unknown, max: number) {
  return String(value ?? "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (clean(body.website, 200)) {
      return NextResponse.json({ ok: true });
    }

    const name = clean(body.name, 120);
    const email = clean(body.email, 254).toLowerCase();
    const topic = clean(body.topic, 40);
    const message = clean(body.message, 4000);

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!topics.has(topic)) {
      return NextResponse.json({ error: "Please choose a valid support topic." }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Please tell us a little more about what you need." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.from("contact_messages").insert({ name, email, topic, message });
    if (error) {
      return NextResponse.json({ error: "We could not send your message right now. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
