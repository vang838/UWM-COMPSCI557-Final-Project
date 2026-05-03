"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PlayerNavigation from "../../src/components/navigation";

export default function PlayerSearchPage() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();

    const search = query.trim();

    if (search) {
      router.push(`/players?search=${encodeURIComponent(search)}`);
    } else {
      router.push("/players");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#ffffff",
        padding: "2rem",
      }}
    >
      {/* Navigation Tabs */}
      <PlayerNavigation />

      {/* Centered Search */}
      <div
        style={{
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Search players..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "300px",
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              backgroundColor: "#000",
              color: "#fff",
              border: "1px solid #ffffff",
              outline: "none",
            }}
          />
        </form>
      </div>
    </main>
  );
}
