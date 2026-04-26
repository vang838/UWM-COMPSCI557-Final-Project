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
        <div style={{ width: "90px" }} /> {/* spacer */}
        <h1 style={{ color: "#e0e0e0", fontSize: "1.75rem", fontWeight: 700 }}>Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{ padding: "10px 16px", backgroundColor: "red", color: "white", border: "none", cursor: "pointer", borderRadius: "4px", fontWeight: 600, fontSize: "0.9rem",}}>
          Logout
        </button>
      </div>

      <div style={{ backgroundColor: "#1e1e1e", padding: "24px", borderRadius: "10px", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", border: "1px solid #2e2e2e", }}>
        <p style = {{ fontSize: "1.1rem", marginBottom: "8px", color: "#e0e0e0", }}>
          <strong>Welcome, {username}!</strong>
        </p>
        <p style={{ color: "#6b6b6b", marginBottom: "12px" }}>Role: {role}</p>
        <hr style={{ borderColor: "2e2e2e", marginBottom: "16px", }} />
        <p style={{ fontWeight: 600, marginBottom: "8px", color: "e0e0e0" }}>Admin Features:</p>
        <ul style={{ paddingLeft: "20px", color: "#a0a0a0", lineHeight: "1.8", }}>
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