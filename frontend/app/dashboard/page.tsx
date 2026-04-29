'use client';

import React, {useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {dashboardAPI} from "@/src/api";
import {playerAPI} from "@/src/api/players";
import {seasonAPI} from "@/src/api/seasons";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, {NavSection} from "@/src/components/pageLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
    id?: number;
    player_id?: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    jersey_number?: number | string;
    is_active?: boolean;
}

interface Season {
    id?: number;
    season_id?: number;
    year?: number | string;
}

interface DashboardStats {
    roster_size?: number;
    total_tds?: number;
    pass_yards_per_game?: number;
    rush_yards_per_game?: number;
}

interface LeaderboardRow {
    player_id?: number;
    id?: number;
    player_name?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    position?: string;
    stat_type?: string;
    stat_value?: number | string;
    value?: number | string;
    total?: number | string;
}

interface SeasonBarData {
    year: string;
    height: number;
    current: boolean;
}

interface PlayerComparisonData {
    label: string;
    l: number;
    r: number;
    lv: string;
    rv: string;
}

// ---------------------------------------------------------------------------
// Nav config
// ---------------------------------------------------------------------------

const USER_NAV: NavSection[] = [
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
];

const AVATAR_COLORS = [
    "bg-[#c49a22]/20 text-[#f0c040]",
    "bg-emerald-900/40 text-emerald-400",
    "bg-blue-900/40 text-blue-400",
    "bg-rose-900/40 text-rose-400",
    "bg-violet-900/40 text-violet-400",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function unwrapApiData<T>(response: unknown): T {
    const maybeResponse = response as { data?: T };
    return maybeResponse?.data ?? (response as T);
}

function normalizeApiList<T>(response: unknown): T[] {
    const data = unwrapApiData<any>(response);

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.results)) {
        return data.results;
    }

    return [];
}

function getPlayerId(player: Player): number | string {
    return player.id ?? player.player_id ?? crypto.randomUUID();
}

function getLeaderboardId(row: LeaderboardRow, index: number): number | string {
    return row.player_id ?? row.id ?? `${getLeaderboardName(row)}-${index}`;
}

function displayName(player: Player): string {
    return (
        player.name ||
        `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

function getLeaderboardName(row: LeaderboardRow): string {
    return (
        row.player_name ||
        row.name ||
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
        "Unknown player"
    );
}

function getStatValue(row: LeaderboardRow): number {
    const rawValue = row.stat_value ?? row.value ?? row.total ?? 0;
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue : 0;
}

function getSeasonYearFromLabel(label: string): string | undefined {
    return label.match(/\d{4}/)?.[0];
}

function noData(value: unknown): string | number {
    if (value === null || value === undefined || value === "") {
        return "No data";
    }

    return value as string | number;
}

// ---------------------------------------------------------------------------
// Small helper components
// ---------------------------------------------------------------------------
function StatCard({
                      label,
                      value,
                      delta,
                      positive,
                  }: {
    label: string;
    value: string | number;
    delta?: string;
    positive?: boolean;
}) {
    return (
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                {label}
            </p>
            <p className="text-[22px] font-medium text-white leading-none">
                {value}
            </p>
            {delta && (
                <p
                    className={`text-[10px] mt-1 ${
                        positive ? "text-emerald-400" : "text-red-400"
                    }`}
                >
                    {delta}
                </p>
            )}
        </div>
    );
}

function PlayerInitials({name}: { name: string }) {
    const parts = name.trim().split(" ").filter(Boolean);

    const initials =
        parts.length >= 2
            ? `${parts[0][0]}${parts[parts.length - 1][0]}`
            : name.slice(0, 2);

    return <>{initials.toUpperCase()}</>;
}

async function safeApiCall<T>(
    request: () => Promise<unknown>,
    fallback: T
): Promise<T> {
    try {
        const response = await request();
        return unwrapApiData<T>(response);
    } catch {
        return fallback;
    }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
    const router = useRouter();

    const [authChecked, setAuthChecked] = useState(false);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");

    const [activeSection, setActiveSection] = useState("dashboard");
    const [activeSeason, setActiveSeason] = useState("");

    const [showError, setShowError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const [players, setPlayers] = useState<Player[]>([]);
    const [playersLoaded, setPlayersLoaded] = useState(false);

    const [seasons, setSeasons] = useState<Season[]>([]);
    const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
        null
    );
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [seasonBars, setSeasonBars] = useState<SeasonBarData[]>([]);

    // No real comparison endpoint currently exists in frontend/src/api.
    // Keep the state empty so the UI displays "No comparison data available".
    const [comparisonData, setComparisonData] = useState<PlayerComparisonData[]>(
        []
    );

    const [loadingDashboardData, setLoadingDashboardData] = useState(true);
    const [loadingSeasonData, setLoadingSeasonData] = useState(true);
    const [loadingComparisonData, setLoadingComparisonData] = useState(false);

    // Auth guard
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUsername = localStorage.getItem("username");
        const storedRole = localStorage.getItem("role");

        if (!token || storedRole !== "user") {
            router.push("/login");
            return;
        }

        setUsername(storedUsername || "User");
        setRole(storedRole || "");
        setAuthChecked(true);
    }, [router]);

    const showTemporaryError = useCallback((message: string) => {
        setErrorMsg(message);
        setShowError(true);

        const timeout = setTimeout(() => {
            setShowError(false);
        }, 5000);

        return () => clearTimeout(timeout);
    }, []);

    const seasonPills = useMemo(() => {
        return seasons
            .filter((season) => season.year !== undefined && season.year !== null)
            .map((season) => ({
                label: `${season.year} Season`,
            }));
    }, [seasons]);

    const playerList = players;
    const rosterPreview = playerList.slice(0, 5);

    const fetchDashboardData = useCallback(async () => {
        if (!authChecked) {
            return;
        }

        try {
            setLoadingDashboardData(true);
            setLoadingSeasonData(true);
            setLoadingComparisonData(false);
            setComparisonData([]);

            const seasonListRaw = await safeApiCall<unknown[]>(
                () => seasonAPI.getAllSeasons(),
                []
            );

            const seasonList = normalizeApiList<Season>(seasonListRaw)
                .filter((season) => season.year !== undefined && season.year !== null)
                .sort((a, b) => Number(b.year) - Number(a.year));

            setSeasons(seasonList);

            let selectedSeasonYear = getSeasonYearFromLabel(activeSeason) ?? "";

            if (!selectedSeasonYear && seasonList.length > 0) {
                selectedSeasonYear = String(seasonList[0].year);
            }

            if (!activeSeason && selectedSeasonYear) {
                setActiveSeason(`${selectedSeasonYear} Season`);
            }

            const leaderboardParams = selectedSeasonYear
                ? {season: selectedSeasonYear}
                : {};

            const [
                playerListResult,
                dashboardStatsResult,
                leaderboardResult,
                seasonPerformanceResult,
            ] = await Promise.all([
                safeApiCall<unknown[]>(() => playerAPI.getAllPlayers(), []),
                safeApiCall<DashboardStats | null>(
                    () => dashboardAPI.getDashboardStats(),
                    null
                ),
                safeApiCall<unknown[]>(
                    () => dashboardAPI.getPlayerLeaderboard(leaderboardParams),
                    []
                ),
                safeApiCall<unknown[]>(
                    () => dashboardAPI.getSeasonPerformance(),
                    []
                ),
            ]);

            const normalizedPlayers = normalizeApiList<Player>(playerListResult);
            const normalizedLeaderboard =
                normalizeApiList<LeaderboardRow>(leaderboardResult);
            const seasonPerformanceData =
                normalizeApiList<any>(seasonPerformanceResult);

            setPlayers(normalizedPlayers);
            setPlayersLoaded(true);
            setDashboardStats(dashboardStatsResult);
            setLeaderboard(normalizedLeaderboard);

            const values = seasonPerformanceData.map((item) => {
                const rawValue =
                    item.rushing_yards ??
                    item.rush_yards ??
                    item.total_rushing_yards ??
                    item.value ??
                    0;

                const numericValue = Number(rawValue);
                return Number.isFinite(numericValue) ? numericValue : 0;
            });

            const maxValue = Math.max(...values, 0);

            const transformedSeasonBars = seasonPerformanceData.map((item, index) => {
                const value = values[index];

                const year = String(
                    item.year ??
                    item.season_year ??
                    "Unknown"
                );

                const height =
                    maxValue > 0
                        ? Math.max(4, Math.round((value / maxValue) * 80))
                        : 0;

                return {
                    year,
                    height,
                    current: selectedSeasonYear
                        ? year === selectedSeasonYear
                        : index === 0,
                };
            });

            setSeasonBars(transformedSeasonBars);

            const noDashboardData =
                normalizedPlayers.length === 0 &&
                !dashboardStatsResult &&
                normalizedLeaderboard.length === 0 &&
                transformedSeasonBars.length === 0;

            if (noDashboardData) {
                showTemporaryError("No dashboard data available");
            }
        } catch (error) {
            console.error("Unexpected dashboard data error:", error);

            setPlayers([]);
            setPlayersLoaded(false);
            setSeasons([]);
            setDashboardStats(null);
            setLeaderboard([]);
            setSeasonBars([]);
            setComparisonData([]);

            showTemporaryError("No dashboard data available");
        } finally {
            setLoadingDashboardData(false);
            setLoadingSeasonData(false);
            setLoadingComparisonData(false);
        }
    }, [activeSeason, authChecked, showTemporaryError]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

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
                showTemporaryError(data.error || "Logout failed, please try again");
                return;
            }
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            ["token", "user_id", "username", "role"].forEach((key) =>
                localStorage.removeItem(key)
            );

            router.push("/login");
        }
    };

    if (!authChecked || loadingDashboardData) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#111]">
                <LoadingSpinner/>
            </div>
        );
    }

    const rosterSizeValue =
        dashboardStats?.roster_size ??
        (playersLoaded ? playerList.length : undefined);

    const maxLeaderboardValue = Math.max(
        ...leaderboard.map((row) => getStatValue(row)),
        1
    );

    return (
        <PageLayout
            username={username}
            role={role}
            onLogout={handleLogout}
            navSections={USER_NAV}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            title="Dashboard"
            seasonPills={seasonPills}
            activeSeason={activeSeason}
            onSeasonChange={setActiveSeason}
        >
            {/* Error toast */}
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

            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-2">
                <StatCard label="Roster size" value={noData(rosterSizeValue)}/>
                <StatCard label="Total TDs" value={noData(dashboardStats?.total_tds)}/>
                <StatCard
                    label="Pass yds / gm"
                    value={noData(dashboardStats?.pass_yards_per_game)}
                />
                <StatCard
                    label="Rush yds / gm"
                    value={noData(dashboardStats?.rush_yards_per_game)}
                />
            </div>

            {/* Leaderboard + Roster */}
            <div className="grid grid-cols-2 gap-3">
                {/* Leaderboard */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
              Stat leaderboard
            </span>
                        <button
                            className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                            Receiving yds ▾
                        </button>
                    </div>

                    <ul>
                        {leaderboard.length > 0 ? (
                            leaderboard.slice(0, 5).map((row, index) => {
                                const name = getLeaderboardName(row);
                                const pos = row.position || "—";
                                const val = getStatValue(row);
                                const barPct = Math.round((val / maxLeaderboardValue) * 100);
                                const colorClass =
                                    AVATAR_COLORS[index % AVATAR_COLORS.length];

                                return (
                                    <li
                                        key={getLeaderboardId(row, index)}
                                        className="flex items-center gap-2.5 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px]"
                                    >
                    <span
                        className={`text-[10px] w-4 text-right shrink-0 ${
                            index < 2
                                ? "text-[#f0c040] font-medium"
                                : "text-gray-500"
                        }`}
                    >
                      {index + 1}
                    </span>

                                        <span
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0 ${colorClass}`}
                                        >
                      <PlayerInitials name={name}/>
                    </span>

                                        <span className="flex-1 text-white truncate">{name}</span>
                                        <span className="text-[10px] text-gray-500 w-6">
                      {pos}
                    </span>

                                        <div className="w-12 h-0.75 bg-white/8 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#c49a22] rounded-full"
                                                style={{width: `${barPct}%`}}
                                            />
                                        </div>

                                        <span className="text-[12px] font-medium text-white w-10 text-right">
                      {val.toLocaleString()}
                    </span>
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-3 py-4 text-center text-gray-500 text-sm">
                                No leaderboard data available
                            </li>
                        )}
                    </ul>
                </div>

                {/* Roster */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
              Active roster
            </span>
                        <button
                            className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                            View all →
                        </button>
                    </div>

                    <ul>
                        {rosterPreview.length > 0 ? (
                            rosterPreview.map((player) => {
                                const name = displayName(player);
                                const pos = player.position || "—";
                                const num = player.jersey_number ?? "—";
                                const active = player.is_active !== false;

                                return (
                                    <li
                                        key={getPlayerId(player)}
                                        className="flex items-center gap-2 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3 cursor-pointer transition-colors"
                                    >
                    <span
                        className="w-5.5 h-5.5 rounded flex items-center justify-center text-[9px] font-medium bg-[#1a3d28] text-[#f0c040] shrink-0">
                      {num}
                    </span>

                                        <span className="flex-1 text-white truncate">{name}</span>

                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/6 text-gray-400">
                      {pos}
                    </span>

                                        <span
                                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                active ? "bg-emerald-500" : "bg-white/20"
                                            }`}
                                        />
                                    </li>
                                );
                            })
                        ) : (
                            <li className="px-3 py-4 text-center text-gray-500 text-sm">
                                No players found in roster
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Chart + Comparison */}
            <div className="grid grid-cols-2 gap-3">
                {/* Season bar chart */}
                {/* Season bar chart */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
    <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
      Rushing yds by season
    </span>
                        <button
                            className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                            5-yr view
                        </button>
                    </div>

                    <div className="px-3 py-3 min-h-[190px] flex flex-col">
                        <div className="flex-1 flex items-center justify-center">
                            {loadingSeasonData ? (
                                <p className="text-gray-500 text-sm">
                                    Loading season data...
                                </p>
                            ) : seasonBars.length > 0 ? (
                                <div className="flex items-end gap-1.5 h-20 w-full">
                                    {seasonBars.map((bar) => (
                                        <div
                                            key={bar.year}
                                            className="flex-1 flex flex-col items-center gap-1"
                                        >
                                            <div
                                                className={`w-full rounded-t-sm ${
                                                    bar.current ? "bg-[#c49a22]" : "bg-white/10"
                                                }`}
                                                style={{height: `${bar.height}px`}}
                                            />

                                            <span
                                                className={`text-[9px] ${
                                                    bar.current
                                                        ? "text-[#f0c040] font-medium"
                                                        : "text-gray-500"
                                                }`}
                                            >
                {bar.year}
              </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    No season data available
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-auto pt-2">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#c49a22] inline-block"/>
                                Current season
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/15 inline-block"/>
                                Prior seasons
                            </div>
                        </div>
                    </div>
                </div>

                {/* Player comparison */}
                <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
              Player comparison
            </span>
                        <button
                            className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
                            Change players ↗
                        </button>
                    </div>

                    <div className="px-3 py-3">
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1 text-center">
                                <p className="text-[11px] font-medium text-[#f0c040]">
                                    {playerList[0]
                                        ? displayName(playerList[0])
                                        : "No player selected"}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {playerList[0]?.position ?? "—"} · #
                                    {playerList[0]?.jersey_number ?? "—"}
                                </p>
                            </div>

                            <div className="flex items-center text-[10px] text-gray-500">
                                vs
                            </div>

                            <div className="flex-1 text-center">
                                <p className="text-[11px] font-medium text-blue-400">
                                    {playerList[1]
                                        ? displayName(playerList[1])
                                        : "No player selected"}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {playerList[1]?.position ?? "—"} · #
                                    {playerList[1]?.jersey_number ?? "—"}
                                </p>
                            </div>
                        </div>

                        {loadingComparisonData ? (
                            <div className="flex items-center justify-center h-32">
                                <p className="text-gray-500 text-sm">
                                    Loading comparison data...
                                </p>
                            </div>
                        ) : comparisonData.length > 0 ? (
                            comparisonData.map((row) => (
                                <div key={row.label} className="flex items-center gap-1.5 mb-2">
                  <span className="text-[11px] font-medium text-white w-8 text-right">
                    {row.lv}
                  </span>

                                    <div
                                        className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden flex justify-end">
                                        <div
                                            className="h-full bg-[#c49a22] rounded-full"
                                            style={{width: `${row.l}%`}}
                                        />
                                    </div>

                                    <span className="text-[10px] text-gray-500 w-16 text-center shrink-0">
                    {row.label}
                  </span>

                                    <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{width: `${row.r}%`}}
                                        />
                                    </div>

                                    <span className="text-[11px] font-medium text-white w-8">
                    {row.rv}
                  </span>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-32">
                                <p className="text-gray-500 text-sm">
                                    No comparison data available
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}