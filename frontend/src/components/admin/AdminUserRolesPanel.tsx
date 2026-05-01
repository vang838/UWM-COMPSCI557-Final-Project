'use client';

import React, { useEffect, useState } from "react";
import { authAPI } from "@/src/api/auth";

interface UserRecord {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: "admin" | "user";
    is_active: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    date_joined?: string;
}

function displayName(user: UserRecord) {
    return (
        `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
        user.username
    );
}

export default function AdminUserRolesPanel() {
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await authAPI.getUsers();
            const data = response.data;

            setUsers(Array.isArray(data) ? data : data.results ?? []);
        } catch (err) {
            console.error("Fetch users error:", err);
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const updateUser = async (
        user: UserRecord,
        payload: Partial<Pick<UserRecord, "role" | "is_active">>
    ) => {
        try {
            setSavingId(user.id);
            setError("");
            setSuccess("");

            const response = await authAPI.updateUser(user.id, payload);
            const updatedUser = response.data;

            setUsers((current) =>
                current.map((item) =>
                    item.id === user.id ? { ...item, ...updatedUser } : item
                )
            );

            setSuccess(`${displayName(user)} updated successfully.`);
        } catch (err) {
            console.error("Update user error:", err);
            setError("Failed to update user. You cannot remove your own admin access.");
        } finally {
            setSavingId(null);
        }
    };

    const deleteUser = async (user: UserRecord) => {
        if (!window.confirm(`Delete ${displayName(user)}?`)) {
            return;
        }

        try {
            setSavingId(user.id);
            setError("");
            setSuccess("");

            await authAPI.deleteUser(user.id);

            setUsers((current) => current.filter((item) => item.id !== user.id));
            setSuccess(`${displayName(user)} deleted successfully.`);
        } catch (err) {
            console.error("Delete user error:", err);
            setError("Failed to delete user. You cannot delete your own account.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="px-3 py-3 border-b border-white/8">
                <p className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                    User roles
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                    Promote, demote, activate, or deactivate users. Admin creation is restricted to trusted admins.
                </p>
            </div>

            {error && (
                <div className="px-3 py-2 text-[12px] text-red-300 bg-red-950/30 border-b border-red-900/40">
                    {error}
                </div>
            )}

            {success && (
                <div className="px-3 py-2 text-[12px] text-emerald-300 bg-emerald-950/30 border-b border-emerald-900/40">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-[1.4fr_1.2fr_120px_120px_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                <span>User</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Actions</span>
            </div>

            {loading ? (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    Loading users...
                </div>
            ) : users.length > 0 ? (
                users.map((user) => (
                    <div
                        key={user.id}
                        className="grid grid-cols-[1.4fr_1.2fr_120px_120px_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 text-[12px]"
                    >
                        <div>
                            <p className="text-white font-medium truncate">
                                {displayName(user)}
                            </p>
                            <p className="text-[10px] text-gray-500">
                                @{user.username}
                            </p>
                        </div>

                        <span className="text-gray-400 truncate">
                            {user.email || "—"}
                        </span>

                        <select
                            value={user.role}
                            disabled={savingId === user.id || user.is_superuser}
                            onChange={(event) =>
                                updateUser(user, {
                                    role: event.target.value as "admin" | "user",
                                })
                            }
                            className="bg-[#111] border border-white/10 rounded px-2 py-1 text-[12px] text-white outline-none focus:border-white/30 disabled:opacity-50"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>

                        <select
                            value={user.is_active ? "active" : "inactive"}
                            disabled={savingId === user.id || user.is_superuser}
                            onChange={(event) =>
                                updateUser(user, {
                                    is_active: event.target.value === "active",
                                })
                            }
                            className="bg-[#111] border border-white/10 rounded px-2 py-1 text-[12px] text-white outline-none focus:border-white/30 disabled:opacity-50"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        <button
                            disabled={savingId === user.id || user.is_superuser}
                            onClick={() => deleteUser(user)}
                            className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Delete
                        </button>
                    </div>
                ))
            ) : (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    No users found.
                </div>
            )}
        </div>
    );
}