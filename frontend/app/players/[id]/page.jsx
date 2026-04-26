"use client";

import React, {useEffect, useState} from "react";
import axios from "axios";
import {useParams} from "next/navigation";
import PlayerNavigation from "../../../src/components/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PlayerCardPage() {
    const {id} = useParams();
    const [player, setPlayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlayer = async () => {
            try {
                if (!id) { throw new Error("Player ID is required."); }

                const response = await axios.get(
                    `${API_BASE_URL}/players/${id}/`
                );
                setPlayer(response.data);
            } catch (err) {
                setError("Unable to load player.");
                console.error("Error fetching player:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlayer();
    }, [id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div
                                className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading player details...</p>
                        </div>
                    </div>
                </div>
            </main>
        )
    }
    if (error) {
        return (
            <main className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full mx-auto">
                        <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
                        <p className="text-red-700 mb-4">{error}</p>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                        >
                            Back to Players
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    if (!player) {
        return (
            <main className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md w-full mx-auto">
                        <h2 className="text-xl font-bold text-yellow-800 mb-2">Player Not Found</h2>
                        <p className="text-yellow-700 mb-4">The requested player could not be found.</p>
                        <button
                            onClick={() => window.history.back()}
                            className="inline-block bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                        >
                            Back to Players
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 py-8">
            {/* Navigation Tabs */}
            <PlayerNavigation/>

            <div className="max-w-4xl mx-auto px-4">
                {/* Player Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="shrink-0">
                            <div
                                className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 flex items-center justify-center">
                                <span className="text-gray-500">Player Image</span>
                            </div>
                        </div>

                        <div className="grow">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                {player.first_name} {player.last_name}
                            </h1>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {player.jersey_number && (
                                    <span
                                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    #{player.jersey_number}
                  </span>
                                )}
                                {player.position && (
                                    <span
                                        className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {player.position}
                  </span>
                                )}
                                {player.team && (
                                    <span
                                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {player.team.team_name || player.team}
                  </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {player.date_of_birth && (
                                    <div>
                                        <p className="text-gray-600">Date of Birth</p>
                                        <p className="font-medium">{player.date_of_birth}</p>
                                    </div>
                                )}
                                {player.height && (
                                    <div>
                                        <p className="text-gray-600">Height</p>
                                        <p className="font-medium">{player.height}</p>
                                    </div>
                                )}
                                {player.weight && (
                                    <div>
                                        <p className="text-gray-600">Weight</p>
                                        <p className="font-medium">{player.weight}</p>
                                    </div>
                                )}
                                {player.college && (
                                    <div>
                                        <p className="text-gray-600">College</p>
                                        <p className="font-medium">{player.college}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player Statistics */}
                {player.seasons && player.seasons.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Season Statistics</h2>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Season</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Games</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passing
                                        Yards
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rushing
                                        Yards
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receiving
                                        Yards
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {player.seasons.map((season) => (
                                    <tr key={season.season_id || season.season_year}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {season.season_year}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {season.games_played || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {season.passing_yards || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {season.rushing_yards || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {season.receiving_yards || '-'}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Additional Player Information */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-600">Status</p>
                            <p className="font-medium">{player.is_active ? 'Active' : 'Inactive'}</p>
                        </div>
                        {player.draft_year && (
                            <div>
                                <p className="text-gray-600">Draft Year</p>
                                <p className="font-medium">{player.draft_year}</p>
                            </div>
                        )}
                        {player.draft_round && (
                            <div>
                                <p className="text-gray-600">Draft Round</p>
                                <p className="font-medium">{player.draft_round}</p>
                            </div>
                        )}
                        {player.draft_pick && (
                            <div>
                                <p className="text-gray-600">Draft Pick</p>
                                <p className="font-medium">{player.draft_pick}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}