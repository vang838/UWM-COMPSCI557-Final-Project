import apiClient from './index';

export const seasonAPI = {
    getAllSeasons: () => apiClient.get('/seasons/'),
    getSeasonByID: (id) => apiClient.get(`/seasons/${id}/`),
    createSeason: (seasonData) => apiClient.post('/seasons/', seasonData),
    updateSeason: (id, seasonData) => apiClient.patch(`/seasons/${id}/`, seasonData),
    deleteSeason: (id) => apiClient.delete(`/seasons/${id}/`),
}