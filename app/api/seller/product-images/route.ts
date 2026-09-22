import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET = "seller-product-images";
const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;

  if (!userId) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const form = await request.formData();
  const productId = String(form.get("productId") ?? "");
  const files = form.getAll("images").filter((value): value is File => value instanceof File && value.size > 0);

  if (!productId) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
  if (!files.length) return NextResponse.json({ error: "Choose at least one image." }, { status: 400 });
  if (files.length > MAX_IMAGES) return NextResponse.json({ error: "You can upload at most 10 product images." }, { status: 400 });

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seller || seller.status !== "approved") {
    return NextResponse.json({ error: "Your seller account must be approved before uploading product images." }, { status: 403 });
  }

  const { data: product } = await supabase
    .from("seller_products")
    .select("id, seller_id")
    .eq("id", productId)
    .maybeSingle();

  if (!product || product.seller_id !== seller.id) {
    return NextResponse.json({ error: "You do not own this product." }, { status: 403 });
  }

  const { count } = await supabase
    .from("seller_product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const existingCount = count ?? 0;
  if (existingCount + files.length > MAX_IMAGES) {
    return NextResponse.json({ error: `This product already has ${existingCount} image(s). The maximum is 10.` }, { status: 400 });
  }

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP and AVIF images are allowed." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Each product image must be 5 MB or smaller." }, { status: 400 });
    }
  }

  const admin = getSupabaseAdmin();
  const { error: bucketError } = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: [...ALLOWED_TYPES],
  });

  if (bucketError && !bucketError.message.toLowerCase().includes("already exists")) {
    return NextResponse.json({ error: "Product image storage is unavailable." }, { status: 503 });
  }

  const uploadedPaths: string[] = [];
  const rows: Array<{ product_id: string; image_url: string; sort_order: number }> = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${seller.id}/${productId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      uploadedPaths.push(path);
      const { data: publicData } = admin.storage.from(BUCKET).getPublicUrl(path);
      rows.push({
        product_id: productId,
        image_url: publicData.publicUrl,
        sort_order: existingCount + index,
      });
    }

    const { error: insertError } = await admin.from("seller_product_images").insert(rows);
    if (insertError) throw new Error(insertError.message);

    if (existingCount === 0) {
      await admin
        .from("seller_products")
        .update({ image_url: rows[0].image_url, updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("seller_id", seller.id);
    }

    return NextResponse.json({ uploaded: rows.length });
  } catch (error) {
    if (uploadedPaths.length) {
      await admin.storage.from(BUCKET).remove(uploadedPaths);
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Image upload failed." }, { status: 500 });
  }
}
