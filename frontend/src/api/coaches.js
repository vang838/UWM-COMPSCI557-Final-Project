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

export const coachAPI = {
    // Coach identity endpoints
    getAllCoaches: (params = {}) =>
        apiClient.get(`/coaches/${buildQuery(params)}`),

    getCoachById: (id) =>
        apiClient.get(`/coaches/${id}/`),

    createCoach: (coachData) =>
        apiClient.post("/coaches/", coachData),

    updateCoach: (id, coachData) =>
        apiClient.patch(`/coaches/${id}/`, coachData),

    deleteCoach: (id) =>
        apiClient.delete(`/coaches/${id}/`),

    // Historical coach assignment endpoints
    getCoachSeasonAssignments: (params = {}) =>
        apiClient.get(`/coach-season-assignments/${buildQuery(params)}`),

    getCoachSeasonAssignmentById: (id) =>
        apiClient.get(`/coach-season-assignments/${id}/`),

    createCoachSeasonAssignment: (assignmentData) =>
        apiClient.post("/coach-season-assignments/", assignmentData),

    updateCoachSeasonAssignment: (id, assignmentData) =>
        apiClient.patch(`/coach-season-assignments/${id}/`, assignmentData),

    deleteCoachSeasonAssignment: (id) =>
        apiClient.delete(`/coach-season-assignments/${id}/`),
};