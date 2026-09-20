import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type OrderItemInput = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderInput = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  items: OrderItemInput[];
};

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as OrderInput;

    if (
      !body.name?.trim() ||
      !body.email?.trim() ||
      !body.phone?.trim() ||
      !body.address?.trim() ||
      !body.city?.trim() ||
      !body.country?.trim() ||
      !Array.isArray(body.items) ||
      body.items.length === 0
    ) {
      return NextResponse.json({ error: "Missing required checkout details." }, { status: 400 });
    }

    const items = body.items.map((item) => ({
      product_slug: item.id,
      product_name: item.name,
      unit_price: Number(item.price),
      quantity: Number(item.quantity),
    }));

    if (
      items.some(
        (item) =>
          !item.product_slug ||
          !item.product_name ||
          !Number.isFinite(item.unit_price) ||
          item.unit_price < 0 ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      return NextResponse.json({ error: "Invalid order items." }, { status: 400 });
    }

    const subtotal = items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const { data: customer, error: customerError } = await supabaseAdmin
      .from("customers")
      .insert({
        full_name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
      })
      .select("id")
      .single();

    if (customerError || !customer) {
      console.error("Customer creation failed:", customerError);
      return NextResponse.json({ error: "Could not create customer record." }, { status: 500 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customer.id,
        subtotal,
        shipping_amount: 0,
        total_amount: subtotal,
        shipping_full_name: body.name.trim(),
        shipping_phone: body.phone.trim(),
        shipping_address: body.address.trim(),
        shipping_city: body.city.trim(),
        shipping_country: body.country.trim(),
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Order creation failed:", orderError);
      return NextResponse.json({ error: "Could not create order." }, { status: 500 });
    }

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        ...item,
      }))
    );

    if (itemsError) {
      console.error("Order items creation failed:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      await supabaseAdmin.from("customers").delete().eq("id", customer.id);
      return NextResponse.json({ error: "Could not save order items." }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      total: subtotal,
      status: "pending",
    });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }
}
