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
    // General player fetch.
    // Accepts optional backend filters:
    // /api/players/
    // /api/players/?team=23&year=2024
    // /api/players/?team=23&year=2024&include_stats=none
    // /api/players/?team=23&year=2024&include_stats=core
    // /api/players/?team=23&year=2024&include_stats=advanced
    // /api/players/?team=23&year=2024&include_stats=all
    getAllPlayers: (params = {}) =>
        apiClient.get(`/players/${buildQuery(params)}`),

    // Lightweight player list for roster/admin tables.
    // Use this when the UI does not need nested season_stats.
    getPlayersWithoutStats: (params = {}) =>
        apiClient.get(
            `/players/${buildQuery({
                ...params,
                include_stats: "none",
            })}`
        ),

    // Default dashboard-safe player fetch.
    // Loads only curated/core stats, not every nflverse advanced stat.
    getPlayersWithCoreStats: (params = {}) =>
        apiClient.get(
            `/players/${buildQuery({
                ...params,
                include_stats: "core",
                stat_scope: "core",
            })}`
        ),

    // Advanced player fetch.
    // Use only for advanced stat panels or detailed analytics views.
    getPlayersWithAdvancedStats: (params = {}) =>
        apiClient.get(
            `/players/${buildQuery({
                ...params,
                include_stats: "advanced",
                stat_scope: "advanced",
            })}`
        ),

    // Full stat payload.
    // Use sparingly because it may return larger nested season_stats arrays.
    getPlayersWithAllStats: (params = {}) =>
        apiClient.get(
            `/players/${buildQuery({
                ...params,
                include_stats: "all",
                stat_scope: "all",
            })}`
        ),

    // Fetch a specific player by ID
    getPlayerById: (id, params = {}) =>
        apiClient.get(`/players/${id}/${buildQuery(params)}`),

    // Fetch player stats for a specific season
    getPlayerStatsBySeason: (playerId, seasonId, params = {}) =>
        apiClient.get(
            `/players/${playerId}/stats/season/${seasonId}/${buildQuery(params)}`
        ),

    // Search players
    searchPlayers: (query) =>
        apiClient.get(`/players/search/${buildQuery({ q: query })}`),

    // Fetch player stats by season for dashboard
    getPlayerSeasonStats: (playerId, params = {}) =>
        apiClient.get(`/players/${playerId}/season-stats/${buildQuery(params)}`),

    // Create a new player
    createPlayer: (playerData) =>
        apiClient.post("/players/", playerData),

    // Update an existing player
    updatePlayer: (id, playerData) =>
        apiClient.patch(`/players/${id}/`, playerData),

    // Delete a player
    deletePlayer: (id) =>
        apiClient.delete(`/players/${id}/`),

    // Dashboard endpoints, only use these if backend routes exist
    getPlayerDashboardData: (playerId, params = {}) =>
        apiClient.get(`/players/${playerId}/dashboard/${buildQuery(params)}`),

    getPlayerSeasonBreakdown: (playerId, params = {}) =>
        apiClient.get(`/players/${playerId}/season-breakdown/${buildQuery(params)}`),
};