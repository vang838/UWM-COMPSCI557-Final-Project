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

export const authAPI = {
    register: (payload) =>
        apiClient.post("/auth/register/", payload),

    getCurrentUser: () =>
        apiClient.get("/auth/me/"),

    updateCurrentUser: (payload) =>
        apiClient.patch("/auth/me/", payload),

    getUserPreferences: () =>
        apiClient.get("/user-preferences/"),

    updateUserPreferences: (payload) =>
        apiClient.patch("/user-preferences/", payload),

    getUsers: (params = {}) =>
        apiClient.get(`/users/${buildQuery(params)}`),

    updateUser: (id, payload) =>
        apiClient.patch(`/users/${id}/`, payload),

    deleteUser: (id) =>
        apiClient.delete(`/users/${id}/`),
};