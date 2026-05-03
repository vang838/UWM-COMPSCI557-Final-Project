import React from "react";
import PlayerList from "../../src/components/PlayerList";
import PlayerNavigation from "../../src/components/navigation";
export default function PlayersPage() {
  return (
    <main style={{ padding: "2rem" }}> 
    <PlayerNavigation />
      <h1>Player Directory</h1>
      <PlayerList />
    </main>
  );
}