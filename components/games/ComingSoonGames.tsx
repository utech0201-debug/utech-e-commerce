const upcomingGames = [
  ["God of War", "God of war.jpg", "Action"],
  ["Asphalt Legends", "asphalt legend.jpg", "Racing"],
  ["Assassin's Creed Shadows", "assasin's creed shadows.jpg", "Adventure"],
  ["Blades of Fire", "blades of fire.jpg", "Action"],
  ["Call of Duty", "call of duty.jpg", "Action"],
  ["Code of War", "code of war.jpg", "Action"],
  ["Dream League Soccer 2026", "dls2026.jpg", "Sports"],
  ["EA Sports FC 25", "fc25.jpg", "Sports"],
  ["Fighting Tiger", "fighting tiger.jpg", "Fighting"],
  ["Free Fire", "freefire.jpg", "Action"],
  ["Major Gun 2", "major gun 2.jpg", "Action"],
  ["Mortal Kombat 2", "mortal kombat 2.jpg", "Fighting"],
  ["Need for Speed Payback", "need for speed payback.jpg", "Racing"],
  ["Payback 2", "payback 2.jpg", "Action"],
  ["Ready or Not", "ready or not.jpg", "Action"],
  ["Transformers: Fall of Cybertron", "transformers the fall of cybertron.jpg", "Action"],
  ["Transformers: The Game", "transformers the game.jpg", "Action"],
] as const;

const gameImage = (file: string) =>
  `https://raw.githubusercontent.com/utech0201-debug/utech-e-commerce/main/NarutoImages/${encodeURIComponent(file)}`;

export default function ComingSoonGames() {
  return (
    <section className="section upcoming-games">
      <div className="container">
        <div className="upcoming-heading">
          <div>
            <span className="eyebrow">MORE IN THE VAULT</span>
            <h2>Coming to UTECH Gaming</h2>
            <p>More titles are being prepared for the store. Pricing and checkout will appear once each title is officially available.</p>
          </div>
          <span className="upcoming-count">{upcomingGames.length} upcoming titles</span>
        </div>

        <div className="upcoming-games-grid">
          {upcomingGames.map(([name, image, genre]) => (
            <article className="upcoming-game-card" key={image}>
              <div className="upcoming-game-image">
                <img src={gameImage(image)} alt={name} loading="lazy" />
                <span>COMING SOON</span>
              </div>
              <div className="upcoming-game-body">
                <span>{genre}</span>
                <h3>{name}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
