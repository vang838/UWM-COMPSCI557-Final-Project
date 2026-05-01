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

export const reportAPI = {
    getPlayerComparison: (params = {}) =>
        apiClient.get(`/reports/player-comparison/${buildQuery(params)}`),
};