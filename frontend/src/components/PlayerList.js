"use client";

import React, { useEffect, useState } from "react";
import { fetchPlayers } from "../api/players";

function PlayerList()
{
    const [players, setPlayers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPlayers = async() => {
            try
            {
                const data = await fetchPlayers();
                setPlayers(data);
            }

            catch(error)
            {
                setError("Failed to fetch players.  Please try again later.");
                console.error(error);
            }

            finally { setLoading(false); }
        }
    }, []);

    if(loading) return <p>Loading...</p>;
    if(error) return <p style={{color:"red"}}>{error}</p>
    if(!players.length) return <p>No players found.</p>;

    return (
        <div>
            <h2>Players</h2>
            <ul>
                {players.map(player => (
                    <li key={player.player_id}>
                        {player.first_name} {player.last_name} - {player.position}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default PlayerList;