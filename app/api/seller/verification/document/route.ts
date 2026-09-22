import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const ALLOWED = new Map([
  ["identity_front", new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])],
  ["identity_back", new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])],
  ["selfie", new Set(["image/jpeg", "image/png", "image/webp"])],
  ["business_registration", new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])],
  ["address_proof", new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])],
]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const form = await request.formData();
  const documentType = String(form.get("document_type") ?? "");
  const file = form.get("file");

  if (!(file instanceof File) || !ALLOWED.has(documentType)) {
    return NextResponse.json({ error: "A valid verification document is required." }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be between 1 byte and 5 MB." }, { status: 400 });
  }

  const allowedTypes = ALLOWED.get(documentType)!;
  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  }

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller) {
    return NextResponse.json({ error: "Seller account not found." }, { status: 404 });
  }

  if (!["submitted", "needs_more_info", "rejected"].includes(seller.verification_status)) {
    return NextResponse.json({ error: "Submit your verification details before uploading documents." }, { status: 409 });
  }

  const { data: verification } = await supabase
    .from("seller_verifications")
    .select("id")
    .eq("seller_id", seller.id)
    .maybeSingle();

  if (!verification) {
    return NextResponse.json({ error: "Verification application not found." }, { status: 404 });
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const path = `${seller.id}/${documentType}/${crypto.randomUUID()}.${extension || "bin"}`;
  const admin = getSupabaseAdmin();

  const { error: uploadError } = await admin.storage
    .from("seller-verification-documents")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "Secure document upload failed." }, { status: 500 });
  }

  const { error: documentError } = await supabase
    .from("seller_verification_documents")
    .insert({
      verification_id: verification.id,
      document_type: documentType,
      storage_path: path,
      status: "submitted",
    });

  if (documentError) {
    await admin.storage.from("seller-verification-documents").remove([path]);
    return NextResponse.json({ error: "Could not register verification document." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
