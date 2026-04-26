"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Check authentication + authorization (admin only)
    const token = localStorage.getItem("token");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");

    if (!token || storedRole !== "admin") {
      router.push("/login");
      return;
    }

    setUsername(storedUsername || "Admin");
    setRole(storedRole || "");
    setLoading(false);
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

    catch (error) { console.error("Logout error:", error); }

    finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      router.push("/login");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "32px", minHeight: "100vh", backgroundColor: "#121212", fontFamily: "var(--font-geist-sans), system-ui, sans-serif", }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <h1>Admin Dashboard</h1>
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
        <p>Admin Features (Coming Soon):</p>
        <ul>
          <li>Create/Edit/Delete Players</li>
          <li>Manage Teams & Seasons</li>
          <li>Manage Coaches</li>
          <li>Manage Statistics</li>
          <li>User Management</li>
        </ul>
      </div>
    </div>
  );
}