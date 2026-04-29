import apiClient from './index';

export const teamAPI = {
    getAllTeams: () => apiClient.get('/teams/'),
    getTeamByID: (id) => apiClient.get(`/teams/${id}/`),
    createTeam: (teamData) => apiClient.post('/teams/', teamData),
    updateTeam: (id, teamData) => apiClient.put(`/teams/${id}`, teamData),
    deleteTeam: (id) => apiClient.delete(`/teams/${id}`),

    // dashboard endpoints
    getTeamStats: (teamId) => apiClient.get(`/teams/${teamId}/stats/`),
    getTeamSeasonStats: (teamId, seasonId) => apiClient.get(`/teams/${teamId}/season-stats/${seasonId}/`),
    getTeamDashboardData: (teamId) => apiClient.get(`/teams/${teamId}/dashboard/`),
    getTeamSeasonBreakdown: (teamId) => apiClient.get(`/teams/${teamId}/season-breakdown/`),
};