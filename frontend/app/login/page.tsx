"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  const [success, setSuccess] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const logoutMessage = sessionStorage.getItem("logoutSuccess");

    if (logoutMessage) {
      setSuccess(logoutMessage);
      setShowSuccess(true);
      sessionStorage.removeItem("logoutSuccess");

      const timeout = setTimeout(() => {
        setShowSuccess(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, []);

  const handleLogin = async () => {
      if (!username || !password) {
        setError("Username and password are required.");
        setShowError(true);

        setTimeout(() => {
          setShowError(false);
        }, 5000);

        return;
      }

      setLoading(true);
      setError("");
      setShowError(false);
      setSuccess("");
      setShowSuccess(false);

      try {
        const response = await fetch("http://localhost:8000/api/auth/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Login failed");
          setShowError(true);

          setTimeout(() => {
            setShowError(false);
          }, 5000);

          return;
        }

        const destination =
          data.role === "admin"
            ? "/admin"
            : data.role === "user"
              ? "/dashboard"
              : "";

        if (!destination) {
          setError("Invalid role");
          setShowError(true);
          return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user_id", String(data.user_id));
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);

        sessionStorage.setItem(
          "loginSuccess",
          `Welcome back, ${data.username}.`
        );

        router.push(destination);
      } catch (err) {
        setError("Network error: Unable to reach login server");
        setShowError(true);
        console.error("Login error:", err);

        setTimeout(() => {
          setShowError(false);
        }, 5000);
      } finally {
        setLoading(false);
      }
    };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleLogin();
    }
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
      {showSuccess && success && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "#ecfdf5",
            color: "#047857",
            padding: "12px",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            zIndex: 1000,
            maxWidth: "400px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            border: "1px solid #a7f3d0",
          }}
        >
          <span>{success}</span>
          <button
            onClick={() => setShowSuccess(false)}
            style={{
              background: "none",
              border: "none",
              color: "#047857",
              cursor: "pointer",
              fontSize: "18px",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {showError && error && (
        <div
          style={{
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
            border: "1px solid #fecaca",
          }}
        >
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

        <input
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onKeyDown={handleKeyDown}
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
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={handleKeyDown}
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
            backgroundColor: "black",
            color: "white",
            border: "1px solid black",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
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