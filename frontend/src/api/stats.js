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

export const statAPI = {
    // StatType endpoints
    // Supports:
    // /api/stat-types/?stat_scope=core
    // /api/stat-types/?stat_scope=advanced
    // /api/stat-types/?stat_scope=all
    // /api/stat-types/?category=passing
    getStatTypes: (params = {}) =>
        apiClient.get(`/stat-types/${buildQuery(params)}`),

    getCoreStatTypes: (params = {}) =>
        apiClient.get(
            `/stat-types/${buildQuery({
                ...params,
                stat_scope: "core",
            })}`
        ),

    getAdvancedStatTypes: (params = {}) =>
        apiClient.get(
            `/stat-types/${buildQuery({
                ...params,
                stat_scope: "advanced",
            })}`
        ),

    getAllStatTypes: (params = {}) =>
        apiClient.get(
            `/stat-types/${buildQuery({
                ...params,
                stat_scope: "all",
            })}`
        ),

    getStatTypeById: (id) =>
        apiClient.get(`/stat-types/${id}/`),

    createStatType: (statTypeData) =>
        apiClient.post("/stat-types/", statTypeData),

    updateStatType: (id, statTypeData) =>
        apiClient.patch(`/stat-types/${id}/`, statTypeData),

    deleteStatType: (id) =>
        apiClient.delete(`/stat-types/${id}/`),

    // PositionStatType endpoints
    getPositionStatTypes: (params = {}) =>
        apiClient.get(`/position-stat-types/${buildQuery(params)}`),

    getCorePositionStatTypes: (params = {}) =>
        apiClient.get(
            `/position-stat-types/${buildQuery({
                ...params,
                stat_scope: "core",
            })}`
        ),

    getAdvancedPositionStatTypes: (params = {}) =>
        apiClient.get(
            `/position-stat-types/${buildQuery({
                ...params,
                stat_scope: "advanced",
            })}`
        ),

    getPositionStatTypeById: (id) =>
        apiClient.get(`/position-stat-types/${id}/`),

    createPositionStatType: (mappingData) =>
        apiClient.post("/position-stat-types/", mappingData),

    updatePositionStatType: (id, mappingData) =>
        apiClient.patch(`/position-stat-types/${id}/`, mappingData),

    deletePositionStatType: (id) =>
        apiClient.delete(`/position-stat-types/${id}/`),

    // PlayerSeasonStat endpoints
    // Supports:
    // /api/player-season-stats/?team=23&year=2024&stat_scope=core
    // /api/player-season-stats/?team=23&year=2024&stat_scope=advanced
    // /api/player-season-stats/?team=23&year=2024&stat_scope=all
    // /api/player-season-stats/?team=23&year=2024&category=passing
    // /api/player-season-stats/?team=23&year=2024&stat_key=passing_yards
    getPlayerSeasonStats: (params = {}) =>
        apiClient.get(`/player-season-stats/${buildQuery(params)}`),

    getCorePlayerSeasonStats: (params = {}) =>
        apiClient.get(
            `/player-season-stats/${buildQuery({
                ...params,
                stat_scope: "core",
            })}`
        ),

    getAdvancedPlayerSeasonStats: (params = {}) =>
        apiClient.get(
            `/player-season-stats/${buildQuery({
                ...params,
                stat_scope: "advanced",
            })}`
        ),

    getAllPlayerSeasonStats: (params = {}) =>
        apiClient.get(
            `/player-season-stats/${buildQuery({
                ...params,
                stat_scope: "all",
            })}`
        ),

    getPlayerSeasonStatsByCategory: (params = {}, category) =>
        apiClient.get(
            `/player-season-stats/${buildQuery({
                ...params,
                category,
            })}`
        ),

    getPlayerSeasonStatsByKey: (params = {}, statKey) =>
        apiClient.get(
            `/player-season-stats/${buildQuery({
                ...params,
                stat_key: statKey,
            })}`
        ),

    getPlayerSeasonStatById: (id) =>
        apiClient.get(`/player-season-stats/${id}/`),

    createPlayerSeasonStat: (statData) =>
        apiClient.post("/player-season-stats/", statData),

    updatePlayerSeasonStat: (id, statData) =>
        apiClient.patch(`/player-season-stats/${id}/`, statData),

    deletePlayerSeasonStat: (id) =>
        apiClient.delete(`/player-season-stats/${id}/`),
};