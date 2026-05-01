"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if( !username || !password ) {
        setError("Username and password are required.");
        return;
    }

    setLoading(true);
    setError("");

    try {
        // call backend login api endpoint
        const response = await fetch("http://localhost:8000/api/auth/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json", },
            body: JSON.stringify({username, password}),
        });

        const data = await response.json();

        if(!response.ok) {
            // Adds specific error from backend
            setError(data.error || "Login failed");
            setShowError(true);
            setTimeout(() => setShowError(false), 5000); // hides error after 5 seconds
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);

        // Role-based routing (separate dashboards)
        if(data.role === "admin") { router.push("/admin")}
        else if (data.role === "user") { router.push("/dashboard")}
        else { setError("Invalid role"); }
    }

    catch(err) {
        // Network error handling
        setError("Network error: Unable to reach login server");
        console.error("Login error:", err);
    }

    finally { setLoading(false); }
  };

  // Allow enter key to submit
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if(e.key === "Enter") { handleLogin(); }
    };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "black",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "8px",
          width: "320px",
          color: "black", 
        }}
      >
        <h2 style={{ textAlign: "center" }}>Login</h2>
        {/* error toast for failed login */}
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

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "16px",
            padding: "8px",
            border: "1px solid black",
            color: "black",
            backgroundColor: "white",
            WebkitTextFillColor: "black",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "12px",
            padding: "8px",
            border: "1px solid black",
            color: "black",
            backgroundColor: "white",
            WebkitTextFillColor: "black",
          }}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            marginTop: "16px",
            width: "100%",
            padding: "10px",
            backgroundColor: "white",
            color: "black",
            border: "1px solid black",
            cursor: "pointer",
          }}
        >
            {loading ? "Logging in..." : "Login"}
        </button>

          <div
              style={{
                marginTop: "18px",
                textAlign: "center",
                fontSize: "13px",
                color: "#555",
              }}
            >
              <span>Don&apos;t have an account? </span>
              <Link
                href="/register"
                style={{
                  color: "black",
                  fontWeight: 600,
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                }}
              >
                Create one
              </Link>
            </div>
        <style jsx>{`
          input::placeholder {
            color: black;
          }
        `}</style>
      </div>
    </div>
  );
}