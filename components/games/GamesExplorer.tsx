"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/data/products";

const filters = [
  { label: "All Games", value: "all" },
  { label: "Action", value: "Action Game" },
  { label: "Adventure", value: "Adventure Game" },
  { label: "Sports", value: "Sports Game" },
  { label: "Racing", value: "Racing Game" },
  { label: "Fighting", value: "Fighting Game" },
];

export default function GamesExplorer({ games }: { games: Product[] }) {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");

  const visibleGames = useMemo(() => {
    const search = query.trim().toLowerCase();
    return games.filter((game) => {
      const matchesType = active === "all" || game.type === active;
      const matchesSearch =
        !search ||
        game.name.toLowerCase().includes(search) ||
        game.description.toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });
  }, [active, query, games]);

  return (
    <>
      <div className="games-toolbar">
        <div className="games-toolbar-copy">
          <span className="eyebrow">GAME LIBRARY</span>
          <h2>Find your next game</h2>
          <p>{visibleGames.length} titles available in the UTECH Store.</p>
        </div>

        <label className="games-search">
          <span className="sr-only">Search games</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search games..."
          />
        </label>
      </div>

      <div className="games-filters" aria-label="Game categories">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={active === filter.value ? "game-filter active" : "game-filter"}
            onClick={() => setActive(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {visibleGames.length > 0 ? (
        <div className="product-grid games-grid">
          {visibleGames.map((game) => (
            <ProductCard key={game.id} product={game} />
          ))}
        </div>
      ) : (
        <div className="games-empty">
          <span className="eyebrow">NO RESULTS</span>
          <h3>No games match your search.</h3>
          <p>Try another title or category.</p>
        </div>
      )}
    </>
  );
}
