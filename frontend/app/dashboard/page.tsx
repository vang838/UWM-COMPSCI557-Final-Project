'use client';

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApiData } from "@/src/hooks/useApiData";
import { playerAPI } from "@/src/api/players";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout from "@/src/components/pageLayout";

export default function DashboardPage() {
    const router = useRouter();
    const [username, setUsername] = React.useState("");
    const [role, setRole] = React.useState("");
    const [showError, setShowError] = React.useState(false);
    const [error, setError] = React.useState("");

    const fetchPlayers = React.useCallback(() => playerAPI.getAllPlayers(), []);
    const { data: players, loading, error: apiError } = useApiData(fetchPlayers);

    useEffect(() => {
        // Check authentication (prevent unauthorized access)
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        if(!token || storedRole !== "user") {
            router.push("/login");
            return;
        }

        setUsername(storedUsername || "User");
        setRole(storedRole || "");
    }, [router]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/api/auth/logout/", {
                method: "POST",
                headers: {
                    "Authorization": `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if(!response.ok) {
                setError(data.error || "Logout failed, please try again");
                setShowError(true);
                setTimeout(() => setShowError(false), 5000);
                return;
            }
        }

        catch(error) {
            console.error("Logout error:", error);
        }

        finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            router.push("/login");
        }
    };

    useEffect(() => {
        if (apiError) {
            setError(apiError);
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
        }
    }, [apiError]);

    if(loading) {
        return (
            <PageLayout title="Dashboard" navigation={<div>Navigation</div>}>
                <LoadingSpinner />
            </PageLayout>
        );
    }

    return (
        <PageLayout title="Dashboard" navigation={<div>Navigation</div>}>
            {/* error toast for failed logout attempt */}
            {showError && error && (
                <div style={{
                    position: "fixed",
                    top: "20px",
                    right: "20px",
                    backgroundColor: "#fee",
                    color: "#c33",
                    padding: "12px",
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    maxWidth: "400px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                }}>
                    <span>{error}</span>
                    <button
                        onClick={() => setShowError(false)}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#c33",
                            cursor: "pointer",
                            fontSize: "18px",
                            padding: "0 4px",
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Header Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div style={{ width: "90px", }} /> {/* Added Spacer */}
                <h1 style={{ color: "#333", fontSize: "1.75rem", fontWeight: 700 }}>
                    User Dashboard
                </h1>

                <button
                    onClick={handleLogout}
                    style={{
                        padding: "10px 16px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                    }}
                >
                    Logout
                </button>
            </div>

            {/* User Info Section */}
            <div style={{
                backgroundColor: "#1e1e1e", // Dark gray background for content cards
                padding: "24px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                border: "1px solid #2e2e2e",
                marginBottom: "32px"
            }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "8px", color: "#e0e0e0" }}>
                    <strong>Welcome, {username}!</strong>
                </p>
                <p style={{ color: "#6b6b6b", marginBottom: "12px" }}>Role: {role}</p>
                <hr style={{ borderColor: "#2e2e2e", marginBottom: "16px" }} />
                <p style={{ fontWeight: 600, marginBottom: "8px", color: "#e0e0e0" }}>
                    Standard User Features:
                </p>
                <ul style={{ paddingLeft: "20px", color: "#a0a0a0", lineHeight: "1.8" }}>
                    <li>Search players</li>
                    <li>View seasonal statistics</li>
                    <li>Filter by team/season</li>
                    <li>Compare player performance</li>
                </ul>
            </div>

            {/* Player List Section */}
            <div style={{
                backgroundColor: "#1e1e1e", // Dark gray background for content cards
                padding: "24px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                border: "1px solid #2e2e2e",
            }}>
                <h2 style={{ color: "#e0e0e0", fontSize: "1.5rem", fontWeight: 600, marginBottom: "16px" }}>
                    Players
                </h2>
                <div className="min-h-32">
                    {players ? (
                        <p>Player count: {players.length}</p>
                    ) : (
                        <p>No players available</p>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}