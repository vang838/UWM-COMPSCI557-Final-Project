'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { authAPI } from "@/src/api/auth";

export default function RegisterPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        confirm_password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await authAPI.register(formData);
            const data = response.data;

            localStorage.setItem("token", data.token);
            localStorage.setItem("user_id", String(data.user_id));
            localStorage.setItem("username", data.username);
            localStorage.setItem("role", data.role);

            router.push("/dashboard");
        } catch (err: any) {
            console.error("Register error:", err);

            const responseData = err?.response?.data;

            if (responseData) {
                setError(JSON.stringify(responseData));
            } else {
                setError("Registration failed.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#111] text-white flex items-center justify-center px-4">
            <form
                onSubmit={handleRegister}
                className="w-full max-w-md bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden"
            >
                <div className="px-4 py-3 border-b border-white/8">
                    <h1 className="text-lg font-semibold">Create account</h1>
                    <p className="text-xs text-gray-500">
                        Public registration creates standard user accounts only.
                    </p>
                </div>

                <div className="p-4 grid gap-3">
                    {error && (
                        <div className="border border-red-900/50 bg-red-950/30 text-red-300 rounded px-3 py-2 text-xs">
                            {error}
                        </div>
                    )}

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Username
                        </span>
                        <input
                            value={formData.username}
                            onChange={(event) => updateField("username", event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Email
                        </span>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                        />
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                First name
                            </span>
                            <input
                                value={formData.first_name}
                                onChange={(event) => updateField("first_name", event.target.value)}
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Last name
                            </span>
                            <input
                                value={formData.last_name}
                                onChange={(event) => updateField("last_name", event.target.value)}
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            />
                        </label>
                    </div>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Password
                        </span>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(event) => updateField("password", event.target.value)}
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            required
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            Confirm password
                        </span>
                        <input
                            type="password"
                            value={formData.confirm_password}
                            onChange={(event) =>
                                updateField("confirm_password", event.target.value)
                            }
                            className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            required
                        />
                    </label>
                </div>

                <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.push("/login")}
                        className="text-xs text-gray-400 hover:text-white bg-transparent border-none cursor-pointer"
                    >
                        Already have an account?
                    </button>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-sm hover:bg-emerald-800/60 disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create account"}
                    </button>
                </div>
            </form>
        </main>
    );
}