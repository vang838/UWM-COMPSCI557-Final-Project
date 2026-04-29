'use client';

import React, {useEffect, useState, useCallback} from "react";
import {useRouter} from "next/navigation";
import {useApiData} from "@/src/hooks/useApiData";
import {playerAPI} from "@/src/api/players";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, {NavSection} from "@/src/components/pageLayout";

// Nav config — admin has access to everything
const ADMIN_NAV: NavSection[] = [
    {
        heading: "Overview",
        items: [
            {label: "Dashboard", section: "dashboard"},
            {label: "Season summary", section: "season-summary"},
        ],
    },
    {
        heading: "Roster",
        items: [
            {label: "Players", section: "players"},
            {label: "Coaches", section: "coaches"},
            {label: "Team roster", section: "team-roster"},
        ],
    },
    {
        heading: "Stats",
        items: [
            {label: "Player stats", section: "player-stats"},
            {label: "Stat types", section: "stat-types"},
            {label: "Leaderboard", section: "leaderboard"},
            {label: "Comparison", section: "comparison"},
        ],
    },
    {
        heading: "Admin",
        items: [
            {label: "Manage seasons", section: "manage-seasons", adminOnly: true},
            {label: "User roles", section: "user-roles", adminOnly: true},
        ],
    },
];


// CRUD management area
function AdminActionCard({
                             title,
                             description,
                             actions,
                         }: {
    title: string;
    description: string;
    actions: string[];
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg p-4">
            <p className="text-[13px] font-medium text-white mb-1">{title}</p>
            <p className="text-[11px] text-gray-500 mb-3">{description}</p>
            <div className="flex flex-wrap gap-1.5">
                {actions.map((action) => (
                    <button
                        key={action}
                        className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:border-[#c49a22]/50 hover:text-[#f0c040] transition-colors cursor-pointer bg-transparent"
                    >
                        {action}
                    </button>
                ))}
            </div>
        </div>
    );
}

// page component
export default function AdminPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [activeSection, setActiveSection] = useState("dashboard");
    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const fetchPlayers = useCallback(() => playerAPI.getAllPlayers(), []);
    const {data: players, loading, error: apiError} = useApiData(fetchPlayers);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        if (!token || storedRole !== "admin") {
            router.push("/login");
            return;
        }

        setUsername(storedUsername || "Admin");
        setRole(storedRole || "");
    }, [router]);

    // surface API errors
    useEffect(() => {
        if (apiError) {
            setErrorMsg(apiError);
            setShowError(true);
            const t = setTimeout(() => setShowError(false), 5000);
            return () => clearTimeout(t);
        }
    }, [apiError]);

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("http://localhost:8000/api/auth/logout/", {
                method: "POST",
                headers: {
                    Authorization: `Token ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!response.ok) {
                const data = await response.json();
                setErrorMsg(data.error || "Logout failed, please try again");
                setShowError(true);
                setTimeout(() => setShowError(false), 5000);
                return;
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            ["token", "user_id", "username", "role"].forEach((k) =>
                localStorage.removeItem(k)
            );
            router.push("/login");
        }
    };

    const playerList: Player[] = players || [];

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#111]">
                <LoadingSpinner/>
            </div>
        );
    }

    return (
        <PageLayout
            // no view filter for admin
            username={username}
            role={role}
            onLogout={handleLogout}
            navSections={ADMIN_NAV}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            title="Admin Dashboard"
        >
            {/* error toast */}
            {showError && errorMsg && (
                <div
                    className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm">
                    <span className="flex-1">{errorMsg}</span>
                    <button
                        onClick={() => setShowError(false)}
                        className="text-red-400 hover:text-red-200 text-lg leading-none cursor-pointer bg-transparent border-none"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Summary strip */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    {label: "Total players", value: playerList.length || 0},
                    {label: "Active players", value: playerList.filter((p) => p.is_active).length || 0},
                    {label: "Teams", value: "—"},
                    {label: "Seasons", value: "—"},
                ].map(({label, value}) => (
                    <div key={label} className="bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5">
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</p>
                        <p className="text-[22px] font-medium text-white leading-none">{value}</p>
                    </div>
                ))}
            </div>

            {/* Management areas */}
            <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                    Management
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <AdminActionCard
                        title="Players"
                        description="Manage player records across all teams and seasons."
                        actions={["Add player", "Edit player", "Deactivate", "Delete"]}
                    />
                    <AdminActionCard
                        title="Teams & seasons"
                        description="Create and manage teams, seasons, and roster assignments."
                        actions={["Add team", "Add season", "Edit roster", "Delete"]}
                    />
                    <AdminActionCard
                        title="Coaches"
                        description="Track coaching staff history and assignments per season."
                        actions={["Add coach", "Edit coach", "Assign to team", "Delete"]}
                    />
                    <AdminActionCard
                        title="Statistics"
                        description="Create stat types and enter or correct player season stats."
                        actions={["Add stat type", "Enter stats", "Edit stats", "Delete"]}
                    />
                </div>
            </div>

            {/* Player list — real data, with inline active toggle placeholder */}
            <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
                    Player records ({playerList.length})
                </p>
                <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                    {/* Table header */}
                    <div
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
                        <span>Name</span>
                        <span>Position</span>
                        <span>Team</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {/* Rows */}
                    {playerList.length > 0 ? (
                        playerList.slice(0, 10).map((p) => (
                            <div
                                key={p.player_id}
                                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]"
                            >
                <span className="text-white font-medium">
                  {p.first_name} {p.last_name}
                </span>
                                <span className="text-gray-400">{p.position}</span>
                                <span className="text-gray-400">#{p.team}</span>
                                <span>
                  <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                          p.is_active
                              ? "bg-emerald-900/40 text-emerald-400"
                              : "bg-white/5 text-gray-500"
                      }`}
                  >
                    <span
                        className={`w-1 h-1 rounded-full inline-block ${p.is_active ? "bg-emerald-400" : "bg-gray-600"}`}/>
                      {p.is_active ? "Active" : "Inactive"}
                  </span>
                </span>
                                <div className="flex gap-1.5">
                                    <button
                                        className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">
                                        Edit
                                    </button>
                                    <button
                                        className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-6 text-center text-[12px] text-gray-500">
                            No players found. Use the management panel above to add players.
                        </div>
                    )}

                    {/* Footer — show if list is truncated */}
                    {playerList.length > 10 && (
                        <div className="px-3 py-2 border-t border-white/8 text-[11px] text-gray-500 text-center">
                            Showing 10 of {playerList.length} players —{" "}
                            <button
                                onClick={() => setActiveSection("players")}
                                className="text-[#f0c040] hover:underline cursor-pointer bg-transparent border-none"
                            >
                                view all
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}