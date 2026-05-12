'use client';

import React, { useEffect, useState } from "react";
import { authAPI } from "@/src/api/auth";
import ConfirmDialog from "@/src/components/ui/ConfirmDialog";

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

type UserEditFormData = {
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: "admin" | "user";
    is_active: boolean;
};

// helpers/formatters
function displayName(user: UserRecord) {
    return (
        `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
        user.username
    );
}

function userToEditForm(user: UserRecord): UserEditFormData {
    return {
        username: user.username ?? "",
        email: user.email ?? "",
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        role: user.role,
        is_active: user.is_active,
    };
}

// handlers
export default function AdminUserRolesPanel() {
    const [users, setUsers] = useState<UserRecord[]>([]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [createForm, setCreateForm] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        role: "user" as "admin" | "user",
        is_active: true,
        password: "",
    });

    const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
    const [editForm, setEditForm] = useState<UserEditFormData | null>(null);

    const [pendingDeleteUser, setPendingDeleteUser] = useState<UserRecord | null>(null);
    const [deletingUser, setDeletingUser] = useState(false);

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
        payload: Partial<UserEditFormData>
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

    const confirmDeleteUser = async () => {
        if (!pendingDeleteUser) {
            return;
        }

        const userToDelete = pendingDeleteUser;

        try {
            setDeletingUser(true);
            setSavingId(userToDelete.id);
            setError("");
            setSuccess("");

            await authAPI.deleteUser(userToDelete.id);

            setUsers((current) =>
                current.filter((item) => item.id !== userToDelete.id)
            );

            setPendingDeleteUser(null);
            setSuccess(`${displayName(userToDelete)} deleted successfully.`);
        } catch (err) {
            console.error("Delete user error:", err);
            setError("Failed to delete user. You cannot delete your own account.");
        } finally {
            setDeletingUser(false);
            setSavingId(null);
        }
    };

    const createUser = async () => {
        if (!createForm.username.trim()) {
            setError("Username is required.");
            return;
        }

        if (!createForm.email.trim()) {
            setError("Email is required.");
            return;
        }

        if (createForm.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        try {
            setCreatingUser(true);
            setError("");
            setSuccess("");

            const response = await authAPI.createUser({
                username: createForm.username.trim(),
                email: createForm.email.trim(),
                first_name: createForm.first_name.trim(),
                last_name: createForm.last_name.trim(),
                role: createForm.role,
                is_active: createForm.is_active,
                password: createForm.password,
            });

            const createdUser = response.data;

            await fetchUsers();

            setCreateForm({
                username: "",
                email: "",
                first_name: "",
                last_name: "",
                role: "user",
                is_active: true,
                password: "",
            });

            setShowCreateModal(false);
            setSuccess(
                `${displayName({
                    ...createdUser,
                    username: createdUser.username || createForm.username.trim(),
                    first_name: createdUser.first_name || createForm.first_name.trim(),
                    last_name: createdUser.last_name || createForm.last_name.trim(),
                })} created successfully.`
            );
        } catch (err) {
            console.error("Create user error:", err);
            setError("Failed to create user. Username or email may already exist.");
        } finally {
            setCreatingUser(false);
        }
    };

    const openEditUser = (user: UserRecord) => {
        setEditingUser(user);
        setEditForm(userToEditForm(user));
        setError("");
        setSuccess("");
    };

    const closeEditUser = () => {
        setEditingUser(null);
        setEditForm(null);
    };

    const handleEditFormChange = (
        field: keyof UserEditFormData,
        value: string | boolean
    ) => {
        setEditForm((current) => {
            if (!current) {
                return current;
            }

            return {
                ...current,
                [field]: value,
            };
        });
    };

    const saveEditedUser = async () => {
        if (!editingUser || !editForm) {
            return;
        }

        if (!editForm.username.trim()) {
            setError("Username is required.");
            return;
        }

        if (!editForm.email.trim()) {
            setError("Email is required.");
            return;
        }

        try {
            setSavingId(editingUser.id);
            setError("");
            setSuccess("");

            const response = await authAPI.updateUser(editingUser.id, {
                username: editForm.username.trim(),
                email: editForm.email.trim(),
                first_name: editForm.first_name.trim(),
                last_name: editForm.last_name.trim(),
                role: editForm.role,
                is_active: editForm.is_active,
            });

            const updatedUser = response.data;

            setUsers((current) =>
                current.map((item) =>
                    item.id === editingUser.id ? { ...item, ...updatedUser } : item
                )
            );

            setSuccess(`${displayName(updatedUser)} updated successfully.`);
            closeEditUser();
        } catch (err) {
            console.error("Edit user error:", err);
            setError("Failed to edit user. You may not be allowed to change this account.");
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
            <div className="px-3 py-3 border-b border-white/8 flex items-center justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
                        Manage users
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">
                        Create accounts, assign roles, activate, deactivate, or remove users.
                    </p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent"
                >
                    Create User
                </button>
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

                        <div className="flex gap-1.5">
                            <button
                                disabled={savingId === user.id || user.is_superuser}
                                onClick={() => openEditUser(user)}
                                className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Edit
                            </button>

                            <button
                                disabled={savingId === user.id || user.is_superuser}
                                onClick={() => setPendingDeleteUser(user)}
                                className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                    No users found.
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                        <div className="px-4 py-3 border-b border-white/8">
                            <p className="text-sm font-medium text-white">
                                Create user account
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Add a new GridTracker account and assign an initial role.
                            </p>
                        </div>

                        <div className="p-4 grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Username
                                </span>
                                <input
                                    value={createForm.username}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            username: event.target.value,
                                        }))
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Email
                                </span>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            email: event.target.value,
                                        }))
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    First name
                                </span>
                                <input
                                    value={createForm.first_name}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            first_name: event.target.value,
                                        }))
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Last name
                                </span>
                                <input
                                    value={createForm.last_name}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            last_name: event.target.value,
                                        }))
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Role
                                </span>
                                <select
                                    value={createForm.role}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            role: event.target.value as "admin" | "user",
                                        }))
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Temporary password
                                </span>
                                <input
                                    type="password"
                                    value={createForm.password}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            password: event.target.value,
                                        }))
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="col-span-2 flex items-center gap-2 text-[12px] text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={createForm.is_active}
                                    onChange={(event) =>
                                        setCreateForm((current) => ({
                                            ...current,
                                            is_active: event.target.checked,
                                        }))
                                    }
                                />
                                Active account
                            </label>
                        </div>

                        <div className="px-4 py-3 border-t border-white/8 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateForm({
                                        username: "",
                                        email: "",
                                        first_name: "",
                                        last_name: "",
                                        role: "user",
                                        is_active: true,
                                        password: "",
                                    });
                                }}
                                disabled={creatingUser}
                                className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={createUser}
                                disabled={creatingUser}
                                className="px-3 py-1.5 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-800/60 disabled:opacity-50"
                            >
                                {creatingUser ? "Creating..." : "Create user"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingUser && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
                    <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                        <div className="px-4 py-3 border-b border-white/8">
                            <p className="text-sm font-medium text-white">
                                Edit {displayName(editingUser)}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                Update account details, role, and account status.
                            </p>
                        </div>

                        <div className="p-4 grid grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Username
                                </span>
                                <input
                                    value={editForm.username}
                                    onChange={(event) =>
                                        handleEditFormChange("username", event.target.value)
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Email
                                </span>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(event) =>
                                        handleEditFormChange("email", event.target.value)
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    First name
                                </span>
                                <input
                                    value={editForm.first_name}
                                    onChange={(event) =>
                                        handleEditFormChange("first_name", event.target.value)
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Last name
                                </span>
                                <input
                                    value={editForm.last_name}
                                    onChange={(event) =>
                                        handleEditFormChange("last_name", event.target.value)
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Role
                                </span>
                                <select
                                    value={editForm.role}
                                    onChange={(event) =>
                                        handleEditFormChange(
                                            "role",
                                            event.target.value as "admin" | "user"
                                        )
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                    Status
                                </span>
                                <select
                                    value={editForm.is_active ? "active" : "inactive"}
                                    onChange={(event) =>
                                        handleEditFormChange(
                                            "is_active",
                                            event.target.value === "active"
                                        )
                                    }
                                    className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </label>
                        </div>

                        <div className="px-4 py-3 border-t border-white/8 flex justify-end gap-2">
                            <button
                                onClick={closeEditUser}
                                disabled={savingId === editingUser.id}
                                className="px-3 py-1.5 rounded border border-white/10 text-gray-300 text-xs hover:text-white hover:border-white/30 disabled:opacity-50 bg-transparent"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={saveEditedUser}
                                disabled={savingId === editingUser.id}
                                className="px-3 py-1.5 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-xs hover:bg-emerald-800/60 disabled:opacity-50"
                            >
                                {savingId === editingUser.id ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmDialog
                open={pendingDeleteUser !== null}
                title="Delete user?"
                variant="danger"
                confirmLabel="Delete User"
                cancelLabel="Cancel"
                loading={deletingUser}
                onCancel={() => {
                    if (!deletingUser) {
                        setPendingDeleteUser(null);
                    }
                }}
                onConfirm={confirmDeleteUser}
                description={
                    <>
                        Are you sure you want to delete{" "}
                        <span className="text-red-300 font-medium">
                            {pendingDeleteUser ? displayName(pendingDeleteUser) : "this user"}
                        </span>
                        ?
                        <p className="text-[11px] text-gray-500 mt-2">
                            For real systems, deactivating an account is usually safer than
                            permanently deleting it because historical records may still reference
                            the user.
                        </p>
                    </>
                }
            />
        </div>
    );
}