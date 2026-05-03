"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function PlayerNavigation() {
  const pathname = usePathname();

  const [lastPlayerId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("lastPlayerId");
  });

  const linkStyle = (active: boolean) => ({
    textDecoration: "none",
    color: "#ffffff",
    fontWeight: active ? "600" : "400",
    borderBottom: active ? "2px solid #d9ff00" : "none",
    paddingBottom: "0.25rem",
  });

  return (
    <nav style={{ display: "flex", gap: "2rem" }}>
      <Link href="/search" style={linkStyle(pathname === "/search")}>
        Search
      </Link>

      <Link
        href="/players"
        style={linkStyle(
          pathname.startsWith("/players") && !pathname.match(/\/players\/\d+/)
        )}
      >
        Players
      </Link>

      {lastPlayerId ? (
        <Link
          href={`/players/${lastPlayerId}`}
          style={linkStyle(!!pathname.match(/\/players\/\d+/))}
        >
          Player Card
        </Link>
      ) : (
        <span style={{ color: "#888" }}>Player Card</span>
      )}
    </nav>
  );
}