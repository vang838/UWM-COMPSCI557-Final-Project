"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("")
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check authentication (prevent nauthorized access)
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        if(!token || storedUsername !== "user") {
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
            await fetch("http://localhost:8000/api/logout", {
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

    return (
    <div style={{ padding: "32px", minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1>User Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 16px",
            backgroundColor: "red",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: "4px",
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ backgroundColor: "white", padding: "16px", borderRadius: "8px" }}>
        <p><strong>Welcome, {username}!</strong></p>
        <p>Role: {role}</p>
        <hr />
        <p>Standard User Features (Coming Soon):</p>
        <ul>
          <li>Search players</li>
          <li>View seasonal statistics</li>
          <li>Filter by team/season</li>
          <li>Compare player performance</li>
        </ul>
      </div>
    </div>
  );
}