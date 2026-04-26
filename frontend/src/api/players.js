// frontend/src/api/players.js
import apiClient from './index';

export const playerApi = {
  // Fetch all players
  getAllPlayers: () => apiClient.get('/players/'),
  
  // Fetch a specific player by ID
  getPlayerById: (id) => apiClient.get(`/players/${id}/`),
  
  // Fetch player stats for a specific season
  getPlayerStatsBySeason: (playerId, seasonId) => 
    apiClient.get(`/players/${playerId}/stats/season/${seasonId}/`),
  
  // Search players
  searchPlayers: (query) => apiClient.get(`/players/search/?q=${query}`),
  
  // Fetch player stats by season for dashboard
  getPlayerSeasonStats: (playerId) => 
    apiClient.get(`/players/${playerId}/season-stats/`),
    
  // Create a new player
  createPlayer: (playerData) => apiClient.post('/players/', playerData),
  
  // Update an existing player
  updatePlayer: (id, playerData) => apiClient.put(`/players/${id}/`, playerData),
  
  // Delete a player
  deletePlayer: (id) => apiClient.delete(`/players/${id}/`),
};