"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function PlayerNavigation() {
  const pathname = usePathname();

  const [lastPlayerId, setLastPlayerId] = useState<string | null>(null);

  useEffect(() => {
      if(typeof window !== "undefined") {
          const storedID = localStorage.getItem("lastPlayerId");
          setLastPlayerId(storedID);
      }
  })

    const isActive = (path: string) => pathname === path;

  const isPlayersPage = () =>
      pathname.startsWith("/players") && !pathname.match(/\/players\/\d+/);

  return (
    <nav style={{ display: "flex", gap: "2rem" }}>
      <Link
        href="/search"
        className={`px-3 py-2 rounded-lg transition ${
          isActive("/search") ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white"
        }`}
      >
        Search
      </Link>

      <Link
        href="/players"
        className={`px-3 py-2 rounded-lg transition ${
            isPlayersPage() ? "bg-blue-600 text-white" : "text-gray-300 hover:text-white"
        }`}>
          Players
      </Link>

      {lastPlayerId ? (
        <Link
          href={`/players/${lastPlayerId}`}
          className={`px-3 py-2 rounded-lg transition ${
              pathname === `/players/${lastPlayerId}` ? "bg-blue-300 text-white" : "text-gray-300 hover:text-white"
          }`}
        >
          Player Card
        </Link>
      ) : (
        <span className={"px-3 py-2 text-gray-600"}>Player Card</span>
      )}
    </nav>
  );
}