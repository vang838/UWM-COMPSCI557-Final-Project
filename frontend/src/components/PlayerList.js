"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { playerAPI } from "@/src/api/players";

function formatHeight(height) {
    if (height === null || height === undefined || height === "") {
        return "N/A";
    }

    const numericHeight = Number(height);

    if (Number.isNaN(numericHeight)) {
        return `${height} in`;
    }

    const feet = Math.floor(numericHeight / 12);
    const inches = numericHeight % 12;

    return `${feet}'${inches}"`;
}

function formatWeight(weight) {
    if (weight === null || weight === undefined || weight === "") {
        return "N/A";
    }

    return `${Number(weight).toFixed(0)} lbs`;
}

function displayValue(value) {
    return value === null || value === undefined || value === "" ? "N/A" : value;
}

function PlayerList() {
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlayers = async () => {
            try {
                const response = await playerAPI.getPlayersWithoutStats();
                setPlayers(response.data);
            } catch (error) {
                setError("Failed to fetch players. Please try again later.");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadPlayers();
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!players.length) return <p>No players found.</p>;

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Players</h2>
                <p className="text-sm text-gray-600">
                    Browse player profiles, roster details, and biographical information.
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => (
                    <Link
                        key={player.player_id}
                        href={`/players/${player.player_id}`}
                        onClick={() =>
                            localStorage.setItem(
                                "lastPlayerId",
                                String(player.player_id)
                            )
                        }
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                        <div className="flex gap-4">
                            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                                {player.headshot_url ? (
                                    <img
                                        src={player.headshot_url}
                                        alt={`${player.first_name} ${player.last_name}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-gray-500">
                                        No Image
                                    </div>
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="truncate text-lg font-semibold text-gray-900">
                                    {player.first_name} {player.last_name}
                                </h3>

                                <p className="text-sm text-gray-600">
                                    {player.position || "N/A"} · {player.team_name || "No team"}
                                </p>

                                <p className="text-sm text-gray-600">
                                    #{player.jersey_number ?? "—"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="text-gray-500">Age</p>
                                <p className="font-medium text-gray-900">
                                    {displayValue(player.age)}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">College</p>
                                <p className="font-medium text-gray-900">
                                    {displayValue(player.college)}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Height</p>
                                <p className="font-medium text-gray-900">
                                    {formatHeight(player.height)}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Weight</p>
                                <p className="font-medium text-gray-900">
                                    {formatWeight(player.weight)}
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default PlayerList;