export type ProductCategory = "games" | "consoles" | "laptops" | "hardware";

export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  category: ProductCategory;
  type: string;
  image: string;
  description: string;
  featured?: boolean;
  sellerId?: string;
  sellerStoreSlug?: string;
  sellerStoreName?: string;
};

const gameImage = (file: string) =>
  `https://raw.githubusercontent.com/utech0201-debug/utech-e-commerce/main/NarutoImages/${encodeURIComponent(file)}`;

export const products: Product[] = [
  {
    id: "ps5",
    slug: "playstation-5",
    name: "PlayStation 5",
    price: 499.99,
    category: "consoles",
    type: "Console",
    image: "/consoles/PlayStation 5.jpg",
    description: "Next-generation gaming with ultra-fast SSD storage and advanced graphics.",
    featured: true,
  },
  {
    id: "xbox-series-x",
    slug: "xbox-series-x",
    name: "Xbox Series X",
    price: 499.99,
    category: "consoles",
    type: "Console",
    image: "/consoles/Xbox Series X.jpg",
    description: "High-performance gaming engineered for native 4K experiences.",
    featured: true,
  },
  {
    id: "switch-oled",
    slug: "nintendo-switch-oled",
    name: "Nintendo Switch OLED",
    price: 349.99,
    category: "consoles",
    type: "Console",
    image: "/consoles/Nintendo Switch (OLED Model).jpg",
    description: "A flexible console experience for home and handheld play.",
  },
  {
    id: "ps5-pro",
    slug: "playstation-5-pro",
    name: "PlayStation 5 Pro",
    price: 699.99,
    category: "consoles",
    type: "Console",
    image: "/consoles/PlayStation 5 Pro.jpg",
    description: "Enhanced PlayStation performance for demanding players.",
  },
  {
    id: "steam-deck-oled",
    slug: "steam-deck-oled",
    name: "Steam Deck OLED",
    price: 549,
    category: "consoles",
    type: "Handheld",
    image: "/consoles/Steam Deck OLED (512GB Build).jpg",
    description: "Portable PC gaming with an OLED display.",
  },
  {
    id: "rog-ally-x",
    slug: "asus-rog-ally-x",
    name: "ASUS ROG Ally X",
    price: 799.99,
    category: "consoles",
    type: "Handheld",
    image: "/consoles/ASUS ROG Ally X.jpg",
    description: "High-performance Windows gaming in a handheld form.",
  },
  {
    id: "legion-pro-5i",
    slug: "lenovo-legion-pro-5i-2026",
    name: "Lenovo Legion Pro 5i 2026",
    price: 1899,
    category: "laptops",
    type: "Gaming Laptop",
    image: "/laptops/gamingLaptops/Lenovo Legion Pro 5i (2026).jpg",
    description: "Serious gaming performance in a powerful portable system.",
    featured: true,
  },
  {
    id: "rog-zephyrus-g14",
    slug: "asus-rog-zephyrus-g14",
    name: "ASUS ROG Zephyrus G14",
    price: 1799,
    category: "laptops",
    type: "Gaming Laptop",
    image: "/laptops/gamingLaptops/ASUS ROG Zephyrus G14 .jpg",
    description: "Compact premium gaming performance for work and play.",
  },
  {
    id: "omen-transcend-14",
    slug: "hp-omen-transcend-14",
    name: "HP Omen Transcend 14",
    price: 1599,
    category: "laptops",
    type: "Gaming Laptop",
    image: "/laptops/gamingLaptops/HP Omen Transcend 14.jpg",
    description: "A slim gaming machine designed for demanding workloads.",
  },
  {
    id: "naruto-shippuden",
    slug: "naruto-shippuden",
    name: "Naruto Shippuden",
    price: 19.99,
    category: "games",
    type: "Action Game",
    image: gameImage("1.jpg"),
    description: "Fast combat, powerful techniques and legendary ninja battles.",
    featured: true,
  },
  {
    id: "spider-man",
    slug: "spider-man",
    name: "Spider-Man",
    price: 14.5,
    category: "games",
    type: "Action Game",
    image: gameImage("2.jpg"),
    description: "A cinematic superhero experience packed with movement and intense combat.",
  },
  {
    id: "marvel-avengers",
    slug: "marvel-avengers",
    name: "Marvel Avengers",
    price: 29.99,
    category: "games",
    type: "Fighting Game",
    image: gameImage("3.jpg"),
    description: "Assemble powerful heroes and take on challenging enemies.",
  },
  {
    id: "naruto-sage-mode",
    slug: "naruto-sage-mode",
    name: "Naruto Sage Mode",
    price: 9.99,
    category: "games",
    type: "Action Game",
    image: gameImage("10.jpg"),
    description: "Master powerful techniques and face increasingly challenging battles.",
  },
  {
    id: "nezha",
    slug: "nezha",
    name: "Nezha",
    price: 24.99,
    category: "games",
    type: "Adventure Game",
    image: gameImage("8.jpg"),
    description: "Explore a mythological world filled with enemies and spectacular battles.",
  },
  {
    id: "nezha-legend",
    slug: "nezha-legend",
    name: "Nezha Legend",
    price: 12,
    category: "games",
    type: "Adventure Game",
    image: gameImage("9.jpg"),
    description: "Continue a legendary adventure through tactical environments and boss encounters.",
  },
  {
    id: "efootball",
    slug: "efootball",
    name: "eFootball",
    price: 15.99,
    category: "games",
    type: "Sports Game",
    image: gameImage("5.jpg"),
    description: "Competitive digital football with tactical control and intense matches.",
  },
  {
    id: "mx-vs-atv",
    slug: "mx-vs-atv",
    name: "MX vs ATV",
    price: 5.5,
    category: "games",
    type: "Racing Game",
    image: gameImage("6.jpg"),
    description: "Off-road racing, aerial stunts and powerful bikes and ATVs.",
  },
  {
    id: "grand-theft-auto-v",
    slug: "grand-theft-auto-v",
    name: "Grand Theft Auto V",
    price: 9.99,
    category: "games",
    type: "Action Game",
    image: gameImage("7.jpg"),
    description: "Open-world action filled with missions, vehicles and unpredictable encounters.",
  },
  {
    id: "need-for-speed",
    slug: "need-for-speed",
    name: "Need for Speed",
    price: 22,
    category: "games",
    type: "Racing Game",
    image: gameImage("4.jpg"),
    description: "High-speed racing with performance cars, challenging roads and intense pursuits.",
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
