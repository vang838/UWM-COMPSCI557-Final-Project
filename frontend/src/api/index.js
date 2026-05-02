import axios from "axios";

// default config of instance
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api",
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// add request interceptor to include auth token
apiClient.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token");

            if (token) {
                // Django REST Framework TokenAuthentication expects "Token", not "Bearer"
                config.headers.Authorization = `Token ${token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// add error handling in response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (typeof window !== "undefined" && error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            localStorage.removeItem("username");
            localStorage.removeItem("role");

            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default apiClient;

// api for dashboard data
export const dashboardAPI = {
    getDashboardStats: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`/dashboard/stats/${queryParams ? `?${queryParams}` : ""}`);
    },

    getPlayerLeaderboard: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`/dashboard/leaderboard/${queryParams ? `?${queryParams}` : ""}`);
    },

    getSeasonPerformance: (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        return apiClient.get(`/dashboard/season-performance/${queryParams ? `?${queryParams}` : ""}`);
    },
};