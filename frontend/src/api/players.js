// frontend/src/api/players.js
import apiClient from "./index";

function buildQuery(params = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, String(value));
        }
    });

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : "";
}

export const playerAPI = {
    // Fetch all players, optionally filtered by team/year
    // Example: getAllPlayers({ team: 23, year: 2024 })
    // Result: /players/?team=23&year=2024
    getAllPlayers: (params = {}) =>
        apiClient.get(`/players/${buildQuery(params)}`),

    // Fetch a specific player by ID
    getPlayerById: (id) =>
        apiClient.get(`/players/${id}/`),

    // Fetch player stats for a specific season
    getPlayerStatsBySeason: (playerId, seasonId) =>
        apiClient.get(`/players/${playerId}/stats/season/${seasonId}/`),

    // Search players
    searchPlayers: (query) =>
        apiClient.get(`/players/search/${buildQuery({ q: query })}`),

    // Fetch player stats by season for dashboard
    getPlayerSeasonStats: (playerId) =>
        apiClient.get(`/players/${playerId}/season-stats/`),

    // Create a new player
    createPlayer: (playerData) =>
        apiClient.post("/players/", playerData),

    // Update an existing player
    updatePlayer: (id, playerData) =>
        apiClient.put(`/players/${id}/`, playerData),

    // Delete a player
    deletePlayer: (id) =>
        apiClient.delete(`/players/${id}/`),

    // Dashboard-specific: Get comprehensive player stats with team info
    getPlayerDashboardData: (playerId) =>
        apiClient.get(`/players/${playerId}/dashboard/`),

    // Dashboard-specific: Get player stats with season breakdown
    getPlayerSeasonBreakdown: (playerId) =>
        apiClient.get(`/players/${playerId}/season-breakdown/`),
};