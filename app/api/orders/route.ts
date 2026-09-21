import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { products } from "@/data/products";

type OrderItemInput = {
  id: string;
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

    const items = body.items.map((item) => {
      const product = products.find(
        (candidate) => candidate.id === item.id || candidate.slug === item.id
      );

      return {
        product,
        quantity: Number(item.quantity),
      };
    });

    if (
      items.some(
        (item) =>
          !item.product ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      return NextResponse.json({ error: "Invalid order items." }, { status: 400 });
    }

    const orderItems = items.map(({ product, quantity }) => ({
      product_slug: product!.slug,
      product_name: product!.name,
      unit_price: product!.price,
      quantity,
    }));

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data } = await supabaseAdmin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq(userId ? "user_id" : "email", userId ?? body.email.trim().toLowerCase())
      .maybeSingle();

    let customerId = existingCustomer?.id;
    let createdCustomerId: string | null = null;

    if (!customerId) {
      const { data: createdCustomer, error: customerError } = await supabaseAdmin
        .from("customers")
        .insert({
          user_id: userId,
          full_name: body.name.trim(),
          email: body.email.trim().toLowerCase(),
          phone: body.phone.trim(),
        })
        .select("id")
        .single();

      if (customerError || !createdCustomer) {
        console.error("Customer creation failed:", customerError);
        return NextResponse.json({ error: "Could not create customer record." }, { status: 500 });
      }

      customerId = createdCustomer.id;
      createdCustomerId = createdCustomer.id;
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_id: customerId,
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
      if (createdCustomerId) {
        await supabaseAdmin.from("customers").delete().eq("id", createdCustomerId);
      }
      return NextResponse.json({ error: "Could not create order." }, { status: 500 });
    }

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(
        orderItems.map((item) => ({
          order_id: order.id,
          ...item,
        }))
      );

    if (itemsError) {
      console.error("Order items creation failed:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      if (createdCustomerId) {
        await supabaseAdmin.from("customers").delete().eq("id", createdCustomerId);
      }
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
