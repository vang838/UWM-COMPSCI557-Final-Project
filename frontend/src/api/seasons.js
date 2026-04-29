import apiClient from './index';

export const seasonAPI = {
    getAllSeasons: () => apiClient.get('/seasons/'),
    getSeasonByID: (id) => apiClient.get(`/seasons/${id}/`),
    createSeason: (seasonData) => apiClient.post('/seasons/', seasonData),
    updateSeason: (id, seasonData) => apiClient.patch(`/seasons/${id}/`, seasonData),
    deleteSeason: (id) => apiClient.delete(`/seasons/${id}/`),

    getTeamSeasons: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`/team-seasons/${queryParams ? `?${queryParams}` : ''}`);
    },

    createTeamSeason: (teamSeasonData) =>
        apiClient.post('/team-seasons/', teamSeasonData),

    updateTeamSeason: (id, teamSeasonData) =>
        apiClient.patch(`/team-seasons/${id}/`, teamSeasonData),

    deleteTeamSeason: (id) =>
        apiClient.delete(`/team-seasons/${id}/`),

    getPlayerSeasonRosters: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`/player-season-rosters/${queryParams ? `?${queryParams}` : ''}`);
    },

    createPlayerSeasonRoster: (rosterData) =>
        apiClient.post('/player-season-rosters/', rosterData),

    updatePlayerSeasonRoster: (id, rosterData) =>
        apiClient.patch(`/player-season-rosters/${id}/`, rosterData),

    deletePlayerSeasonRoster: (id) =>
        apiClient.delete(`/player-season-rosters/${id}/`),
}