import React from "react";
import PlayerList from "../../src/components/PlayerList";

export default function PlayersPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Player Directory</h1>
      <PlayerList />
    </main>
  );
}