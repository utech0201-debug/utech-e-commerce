"use client";

import { Store, StoreIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { isStoreFollowed, toggleFollowedStore } from "@/lib/personalization";

export default function FollowStoreButton({ slug, name, logoUrl }: { slug: string; name: string; logoUrl?: string | null }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    const refresh = () => setFollowing(isStoreFollowed(slug));
    refresh();
    window.addEventListener("utech-followed-stores", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("utech-followed-stores", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [slug]);

  return (
    <button
      type="button"
      className={following ? "follow-store-button following" : "follow-store-button"}
      aria-pressed={following}
      onClick={() => setFollowing(toggleFollowedStore({ slug, name, logoUrl }))}
    >
      {following ? <Store size={16} /> : <StoreIcon size={16} />}
      {following ? "Following" : "Follow store"}
    </button>
  );
}
