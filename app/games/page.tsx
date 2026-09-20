const categories = [
  {
    title: "PC Games",
    description: "A growing selection of PC titles and gaming experiences.",
  },
  {
    title: "Console Games",
    description: "Games for PlayStation, Xbox and Nintendo platforms.",
  },
  {
    title: "Digital Gaming",
    description: "Digital products and gaming services will be added here.",
  },
];

export default function GamesPage() {
  return (
    <section className="section">
      <div className="container">
        <span className="eyebrow">GAMES</span>
        <h1 className="section-title">Level Up Your Library</h1>
        <p className="section-copy">
          Discover games and digital gaming products coming to UTECH Store.
          We are building this section out next.
        </p>

        <div
          className="product-grid"
          style={{ marginTop: 40 }}
        >
          {categories.map((category) => (
            <article
              key={category.title}
              className="checkout-card"
              style={{ minHeight: 220 }}
            >
              <span className="eyebrow">COMING SOON</span>
              <h2 style={{ marginTop: 14 }}>{category.title}</h2>
              <p className="section-copy" style={{ marginTop: 10 }}>
                {category.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
