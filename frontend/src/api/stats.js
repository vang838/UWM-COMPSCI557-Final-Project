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
    getStatTypes: (params = {}) =>
        apiClient.get(`/stat-types/${buildQuery(params)}`),

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

    getPositionStatTypeById: (id) =>
        apiClient.get(`/position-stat-types/${id}/`),

    createPositionStatType: (mappingData) =>
        apiClient.post("/position-stat-types/", mappingData),

    updatePositionStatType: (id, mappingData) =>
        apiClient.patch(`/position-stat-types/${id}/`, mappingData),

    deletePositionStatType: (id) =>
        apiClient.delete(`/position-stat-types/${id}/`),

    // PlayerSeasonStat endpoints
    getPlayerSeasonStats: (params = {}) =>
        apiClient.get(`/player-season-stats/${buildQuery(params)}`),

    getPlayerSeasonStatById: (id) =>
        apiClient.get(`/player-season-stats/${id}/`),

    createPlayerSeasonStat: (statData) =>
        apiClient.post("/player-season-stats/", statData),

    updatePlayerSeasonStat: (id, statData) =>
        apiClient.patch(`/player-season-stats/${id}/`, statData),

    deletePlayerSeasonStat: (id) =>
        apiClient.delete(`/player-season-stats/${id}/`),
};