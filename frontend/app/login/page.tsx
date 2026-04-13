"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    router.push("/search"); // temporary
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

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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

        {error && (
          <p style={{ color: "red", marginTop: "8px" }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
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
          Login
        </button>
        <style jsx>{`
          input::placeholder {
            color: black;
          }
        `}</style>
      </div>
    </div>
  );
}