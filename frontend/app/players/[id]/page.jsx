"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import PlayerNavigation from "../../../src/components/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PlayerCardPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/players/${id}/`
        );
        setPlayer(response.data);
      } catch (err) {
        setError("Unable to load player.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [id]);

  if (loading) return <p>Loading player...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!player) return <p>Player not found.</p>;

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

      {/* Player Card */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "2rem",
        }}
      >
        <div
          style={{
            border: "1px solid #ffffff",
            padding: "2rem",
            maxWidth: "400px",
            width: "100%",
          }}
        >
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            {player.first_name} {player.last_name}
          </h1>

          <p><strong>Position:</strong> {player.position}</p>
          <p><strong>Team:</strong> {player.team}</p>
          {player.age && <p><strong>Age:</strong> {player.age}</p>}
          {player.height && <p><strong>Height:</strong> {player.height}</p>}
          {player.weight && <p><strong>Weight:</strong> {player.weight}</p>}
        </div>
      </div>
    </main>
  );
}