import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (body?.confirmation !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm account deletion." }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: seller } = await admin
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (seller) {
    const { count: payoutCount } = await admin
      .from("seller_payouts")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", seller.id);

    const { count: sellerOrderCount } = await admin
      .from("seller_order_items")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", seller.id);

    if ((payoutCount ?? 0) > 0 || (sellerOrderCount ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "This account has seller financial or order history that must be retained. Contact UTECH support to request account closure.",
        },
        { status: 409 },
      );
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    return NextResponse.json({ error: "Account deletion failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
