import apiClient from './index';

export const teamAPI = {
    getAllTeams: () => apiClient.get('/teams/'),
    getTeamByID: (id) => apiClient.get(`/teams/${id}/`),
    createTeam: (teamData) => apiClient.post('/teams/', teamData),
    updateTeam: (id, teamData) => apiClient.put(`/teams/${id}`, teamData),
    deleteTeam: (id) => apiClient.delete(`/teams/${id}`),
};