"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("")
    const [loading, setLoading] = useState(true);

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
        setLoading(false);
    }, [router]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            await fetch("http://localhost:8000/api/auth/logout/", {
                method: "POST",
                headers: {
                    "Authorization": `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });
        }

        catch(error) { console.error("Logout error:", error); }

        finally {
            // Clear local storage
            localStorage.removeItem("token");
            localStorage.removeItem("user_id");
            localStorage.removeItem("username");
            localStorage.removeItem("role");
            router.push("/login");
        }
    };

    if(loading) return <p>Loading...</p>

    return (
        <div style={{
            padding: "32px",
            minHeight: "100vh",
            backgroundColor: "#121212",
            fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
            <h1 style={{ color: "#e0e0e0", fontSize: "1.75rem", fontWeight: 700 }}>
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

            <div style={{
                backgroundColor: "#1e1e1e",
                padding: "24px",
                borderRadius: "10px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                border: "1px solid #2e2e2e",
            }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "8px", color: "#e0e0e0" }}>
                    <strong>Welcome, {username}!</strong>
                </p>
                <p style={{ color: "#6b6b6b", marginBottom: "12px" }}>Role: {role}</p>
                <hr style={{ borderColor: "#2e2e2e", marginBottom: "16px" }} />
                <p style={{ fontWeight: 600, marginBottom: "8px", color: "#e0e0e0" }}>
                    Standard User Features (Coming Soon):
                </p>
                <ul style={{ paddingLeft: "20px", color: "#a0a0a0", lineHeight: "1.8" }}>
                    <li>Search players</li>
                    <li>View seasonal statistics</li>
                    <li>Filter by team/season</li>
                    <li>Compare player performance</li>
                </ul>
            </div>
        </div>
    );
}