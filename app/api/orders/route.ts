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

type MarketplaceLine = {
  id: string;
  sellerId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  commissionRate: number;
  inventory: number;
};

const sellerProductIdPattern = /^seller-([0-9a-f-]{36})$/i;

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

    const normalizedItems = body.items.map((item) => ({
      id: String(item.id),
      quantity: Number(item.quantity),
    }));

    if (
      normalizedItems.some(
        (item) => !Number.isInteger(item.quantity) || item.quantity < 1,
      )
    ) {
      return NextResponse.json({ error: "Invalid order quantities." }, { status: 400 });
    }

    const sellerIds = normalizedItems
      .map((item) => item.id.match(sellerProductIdPattern)?.[1])
      .filter((id): id is string => Boolean(id));

    const staticItems = normalizedItems.filter(
      (item) => !sellerProductIdPattern.test(item.id),
    );

    const staticLines = staticItems.map((item) => {
      const product = products.find(
        (candidate) => candidate.id === item.id || candidate.slug === item.id,
      );

      return product
        ? {
            sellerId: null,
            product_slug: product.slug,
            product_name: product.name,
            unit_price: product.price,
            quantity: item.quantity,
          }
        : null;
    });

    if (staticLines.some((line) => !line)) {
      return NextResponse.json({ error: "One or more products are no longer available." }, { status: 400 });
    }

    let marketplaceLines: MarketplaceLine[] = [];

    if (sellerIds.length) {
      const { data: sellerProducts, error: sellerProductsError } = await supabaseAdmin
        .from("seller_products")
        .select("id, slug, name, price, inventory, seller_id")
        .in("id", sellerIds)
        .eq("status", "approved");

      if (sellerProductsError) {
        console.error("Marketplace product lookup failed:", sellerProductsError);
        return NextResponse.json({ error: "Could not verify marketplace products." }, { status: 500 });
      }

      const sellerIdSet = [...new Set((sellerProducts ?? []).map((product) => product.seller_id))];
      const { data: sellers, error: sellersError } = await supabaseAdmin
        .from("sellers")
        .select("id, commission_rate, status, order_method")
        .in("id", sellerIdSet)
        .eq("status", "approved");

      if (sellersError) {
        console.error("Seller lookup failed:", sellersError);
        return NextResponse.json({ error: "Could not verify marketplace sellers." }, { status: 500 });
      }

      const sellerMap = new Map(
        (sellers ?? []).map((seller) => [seller.id, seller]),
      );
      const productMap = new Map((sellerProducts ?? []).map((product) => [product.id, product]));

      marketplaceLines = sellerIds.map((id) => {
        const product = productMap.get(id);
        const item = normalizedItems.find((candidate) => candidate.id === "seller-" + id);
        const seller = product ? sellerMap.get(product.seller_id) : undefined;
        const commissionRate = seller ? Number(seller.commission_rate) : undefined;

        if (!product || !seller || commissionRate === undefined || !item) {
          throw new Error("A marketplace product is no longer available.");
        }

        if (seller.order_method === "whatsapp") {
          throw new Error(product.name + " is configured for WhatsApp orders. Please use the seller's WhatsApp order option.");
        }

        if (product.inventory < item.quantity) {
          throw new Error(product.name + " does not have enough stock.");
        }

        return {
          id: product.id,
          sellerId: product.seller_id,
          slug: product.slug,
          name: product.name,
          price: Number(product.price),
          quantity: item.quantity,
          commissionRate,
          inventory: product.inventory,
        };
      });
    }

    const orderItems = [
      ...staticLines.filter(Boolean).map((item) => ({
        product_slug: item!.product_slug,
        product_name: item!.product_name,
        unit_price: item!.unit_price,
        quantity: item!.quantity,
        seller_id: null,
      })),
      ...marketplaceLines.map((item) => ({
        product_slug: item.slug,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
        seller_id: item.sellerId,
      })),
    ];

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
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

    const { data: insertedItems, error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems.map((item) => ({ order_id: order.id, ...item })))
      .select("id, product_slug, seller_id, unit_price, quantity");

    if (itemsError || !insertedItems) {
      console.error("Order items creation failed:", itemsError);
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      if (createdCustomerId) {
        await supabaseAdmin.from("customers").delete().eq("id", createdCustomerId);
      }
      return NextResponse.json({ error: "Could not save order items." }, { status: 500 });
    }

    if (marketplaceLines.length) {
      const marketplaceOrderItems = insertedItems.filter((item) => item.seller_id);
      const sellerOrderItems = marketplaceOrderItems.map((item) => {
        const line = marketplaceLines.find(
          (candidate) => candidate.sellerId === item.seller_id && candidate.slug === item.product_slug,
        );

        if (!line) throw new Error("Could not map marketplace order item.");

        const grossAmount = Number(item.unit_price) * item.quantity;
        const platformFee = Number((grossAmount * line.commissionRate / 100).toFixed(2));

        return {
          order_item_id: item.id,
          seller_id: line.sellerId,
          gross_amount: grossAmount,
          commission_rate: line.commissionRate,
          platform_fee: platformFee,
          seller_amount: Number((grossAmount - platformFee).toFixed(2)),
          payout_status: "pending",
        };
      });

      const { error: sellerItemsError } = await supabaseAdmin
        .from("seller_order_items")
        .insert(sellerOrderItems);

      if (sellerItemsError) {
        console.error("Seller order item creation failed:", sellerItemsError);
        await supabaseAdmin.from("order_items").delete().eq("order_id", order.id);
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        if (createdCustomerId) {
          await supabaseAdmin.from("customers").delete().eq("id", createdCustomerId);
        }
        return NextResponse.json({ error: "Could not record marketplace earnings." }, { status: 500 });
      }

      const { data: inventoryReserved, error: inventoryError } = await supabaseAdmin
        .schema("private")
        .rpc("reserve_seller_inventory", {
          p_items: marketplaceLines.map((line) => ({
            id: line.id,
            quantity: line.quantity,
          })),
        });

      if (inventoryError || inventoryReserved !== true) {
        console.error("Marketplace inventory update failed:", inventoryError);
        await supabaseAdmin
          .from("seller_order_items")
          .delete()
          .in("order_item_id", insertedItems.map((item) => item.id));
        await supabaseAdmin.from("order_items").delete().eq("order_id", order.id);
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        if (createdCustomerId) {
          await supabaseAdmin.from("customers").delete().eq("id", createdCustomerId);
        }
        return NextResponse.json(
          { error: "One or more marketplace products went out of stock. Please review your cart." },
          { status: 409 },
        );
      }
    }

    return NextResponse.json({
      orderId: order.id,
      total: subtotal,
      status: "pending",
    });
  } catch (error) {
    console.error("Order API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid checkout request." },
      { status: 400 },
    );
  }
}
