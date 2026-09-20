import Link from "next/link";

type SuccessPageProps = {
  searchParams: Promise<{ order?: string }>;
};

export default async function CheckoutSuccess({ searchParams }: SuccessPageProps) {
  const { order } = await searchParams;

  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">ORDER RECEIVED</span>
        <h1 className="section-title">Your order has been created.</h1>
        <p className="section-copy">
          We have securely saved your order. Payment processing will be connected next.
        </p>

        {order && (
          <div className="checkout-card" style={{ maxWidth: 640, marginTop: 28 }}>
            <h2>Order reference</h2>
            <p style={{ marginTop: 8, wordBreak: "break-all" }}>{order}</p>
          </div>
        )}

        <Link href="/shop" className="button button-primary" style={{ marginTop: 28 }}>
          Continue Shopping
        </Link>
      </div>
    </section>
  );
}
