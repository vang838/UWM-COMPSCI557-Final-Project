'use client';

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authAPI } from "@/src/api/auth";
import { teamAPI } from "@/src/api/teams";
import { seasonAPI } from "@/src/api/seasons";
import UserAvatar from "@/src/components/UserAvatar";
import LoadingSpinner from "@/src/components/LoadingSpinner";

interface CurrentUser {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: "admin" | "user";
}

interface Team {
    team_id?: number;
    id?: number;
    display_name?: string;
    city?: string;
    team_name?: string;
    abbreviation?: string;
}

interface Season {
    season_id?: number;
    id?: number;
    year?: number | string;
}

interface Preferences {
    id?: number;
    default_team?: number | null;
    default_season?: number | null;
    compact_tables?: boolean;
}

function getTeamId(team: Team) {
    return team.team_id ?? team.id;
}

function getTeamLabel(team: Team) {
    return (
        team.display_name ||
        `${team.city ?? ""} ${team.team_name ?? ""}`.trim() ||
        team.team_name ||
        team.abbreviation ||
        "Unknown team"
    );
}

function getSeasonId(season: Season) {
    return season.season_id ?? season.id;
}

export default function ProfilePage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [user, setUser] = useState<CurrentUser | null>(null);
    const [preferences, setPreferences] = useState<Preferences | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);

    const [profileForm, setProfileForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });

    const [preferenceForm, setPreferenceForm] = useState({
        default_team: "",
        default_season: "",
        compact_tables: false,
    });

    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.push("/login");
            return;
        }

        const loadProfile = async () => {
            try {
                setLoading(true);

                const [userResponse, preferenceResponse, teamResponse, seasonResponse] =
                    await Promise.all([
                        authAPI.getCurrentUser(),
                        authAPI.getUserPreferences(),
                        teamAPI.getAllTeams(),
                        seasonAPI.getAllSeasons(),
                    ]);

                const currentUser = userResponse.data;
                const currentPreferences = preferenceResponse.data;

                const teamData = Array.isArray(teamResponse.data)
                    ? teamResponse.data
                    : teamResponse.data?.results ?? [];

                const seasonData = Array.isArray(seasonResponse.data)
                    ? seasonResponse.data
                    : seasonResponse.data?.results ?? [];

                setUser(currentUser);
                setPreferences(currentPreferences);
                setTeams(teamData);
                setSeasons(seasonData);

                setProfileForm({
                    first_name: currentUser.first_name ?? "",
                    last_name: currentUser.last_name ?? "",
                    email: currentUser.email ?? "",
                });

                setPreferenceForm({
                    default_team: currentPreferences.default_team
                        ? String(currentPreferences.default_team)
                        : "",
                    default_season: currentPreferences.default_season
                        ? String(currentPreferences.default_season)
                        : "",
                    compact_tables: Boolean(currentPreferences.compact_tables),
                });
            } catch (err) {
                console.error("Load profile error:", err);
                setError("Failed to load profile.");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const [updatedUserResponse, updatedPreferenceResponse] = await Promise.all([
                authAPI.updateCurrentUser({
                    first_name: profileForm.first_name.trim(),
                    last_name: profileForm.last_name.trim(),
                    email: profileForm.email.trim(),
                }),
                authAPI.updateUserPreferences({
                    default_team: preferenceForm.default_team
                        ? Number(preferenceForm.default_team)
                        : null,
                    default_season: preferenceForm.default_season
                        ? Number(preferenceForm.default_season)
                        : null,
                    compact_tables: preferenceForm.compact_tables,
                }),
            ]);

            setUser(updatedUserResponse.data);
            setPreferences(updatedPreferenceResponse.data);

            localStorage.setItem("username", updatedUserResponse.data.username);
            localStorage.setItem("role", updatedUserResponse.data.role);

            setSuccess("Profile updated successfully.");
        } catch (err) {
            console.error("Save profile error:", err);
            setError("Failed to save profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#111]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#111] text-white px-6 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <UserAvatar
                            firstName={profileForm.first_name}
                            lastName={profileForm.last_name}
                            username={user?.username}
                            size="lg"
                        />

                        <div>
                            <h1 className="text-xl font-semibold">Profile</h1>
                            <p className="text-sm text-gray-500">
                                Manage account details and dashboard preferences.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            router.push(user?.role === "admin" ? "/admin" : "/dashboard")
                        }
                        className="text-xs px-3 py-1.5 rounded border border-white/10 text-gray-300 hover:text-white hover:border-white/30 bg-transparent"
                    >
                        Back to dashboard
                    </button>
                </div>

                {error && (
                    <div className="border border-red-900/50 bg-red-950/30 text-red-300 rounded-lg px-3 py-2 text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="border border-emerald-900/50 bg-emerald-950/30 text-emerald-300 rounded-lg px-3 py-2 text-sm">
                        {success}
                    </div>
                )}

                <section className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8">
                        <p className="text-sm font-medium">Account information</p>
                        <p className="text-xs text-gray-500">
                            Role and username are controlled by the system.
                        </p>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Username
                            </span>
                            <input
                                value={user?.username ?? ""}
                                disabled
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-gray-500"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Role
                            </span>
                            <input
                                value={user?.role ?? ""}
                                disabled
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-gray-500"
                            />
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                First name
                            </span>
                            <input
                                value={profileForm.first_name}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
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
                                value={profileForm.last_name}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        last_name: event.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            />
                        </label>

                        <label className="col-span-2 flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Email
                            </span>
                            <input
                                type="email"
                                value={profileForm.email}
                                onChange={(event) =>
                                    setProfileForm((current) => ({
                                        ...current,
                                        email: event.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            />
                        </label>
                    </div>
                </section>

                <section className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/8">
                        <p className="text-sm font-medium">Dashboard preferences</p>
                        <p className="text-xs text-gray-500">
                            These settings can be used to default the dashboard view.
                        </p>
                    </div>

                    <div className="p-4 grid grid-cols-2 gap-3">
                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Default team
                            </span>
                            <select
                                value={preferenceForm.default_team}
                                onChange={(event) =>
                                    setPreferenceForm((current) => ({
                                        ...current,
                                        default_team: event.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            >
                                <option value="">No default team</option>
                                {teams.map((team) => {
                                    const teamId = getTeamId(team);

                                    if (teamId === undefined) {
                                        return null;
                                    }

                                    return (
                                        <option key={teamId} value={String(teamId)}>
                                            {getTeamLabel(team)}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>

                        <label className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">
                                Default season
                            </span>
                            <select
                                value={preferenceForm.default_season}
                                onChange={(event) =>
                                    setPreferenceForm((current) => ({
                                        ...current,
                                        default_season: event.target.value,
                                    }))
                                }
                                className="bg-[#111] border border-white/10 rounded px-2 py-1.5 text-sm text-white outline-none focus:border-white/30"
                            >
                                <option value="">No default season</option>
                                {seasons.map((season) => {
                                    const seasonId = getSeasonId(season);

                                    if (seasonId === undefined) {
                                        return null;
                                    }

                                    return (
                                        <option key={seasonId} value={String(seasonId)}>
                                            {season.year}
                                        </option>
                                    );
                                })}
                            </select>
                        </label>

                        <label className="col-span-2 flex items-center gap-2 text-sm text-gray-300">
                            <input
                                type="checkbox"
                                checked={preferenceForm.compact_tables}
                                onChange={(event) =>
                                    setPreferenceForm((current) => ({
                                        ...current,
                                        compact_tables: event.target.checked,
                                    }))
                                }
                            />
                            Use compact table layout
                        </label>
                    </div>
                </section>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 rounded border border-emerald-800 bg-emerald-900/40 text-emerald-300 text-sm hover:bg-emerald-800/60 disabled:opacity-50"
                    >
                        {saving ? "Saving..." : "Save profile"}
                    </button>
                </div>
            </div>
        </main>
    );
}