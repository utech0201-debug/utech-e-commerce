import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";

  if (fullName.length < 2 || fullName.length > 120) {
    return NextResponse.json({ error: "Name must be between 2 and 120 characters." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (profileError) {
    return NextResponse.json({ error: "Profile update failed. Please try again." }, { status: 500 });
  }

  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    return NextResponse.json({ error: "Profile was not fully updated. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
