'use client';

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApiData } from "@/src/hooks/useApiData";
import { playerAPI } from "@/src/api/players";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, { NavSection } from "@/src/components/pageLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Player {
  id: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  position?: string;
  jersey_number?: number | string;
  is_active?: boolean;
}

// ---------------------------------------------------------------------------
// Nav config — defined here so the admin page can define its own separately
// ---------------------------------------------------------------------------

const USER_NAV: NavSection[] = [
  {
    heading: "Overview",
    items: [
      { label: "Dashboard", section: "dashboard" },
      { label: "Season summary", section: "season-summary" },
    ],
  },
  {
    heading: "Roster",
    items: [
      { label: "Players", section: "players" },
      { label: "Coaches", section: "coaches" },
      { label: "Team roster", section: "team-roster" },
    ],
  },
  {
    heading: "Stats",
    items: [
      { label: "Player stats", section: "player-stats" },
      { label: "Stat types", section: "stat-types" },
      { label: "Leaderboard", section: "leaderboard" },
      { label: "Comparison", section: "comparison" },
    ],
  },
];

const SEASON_PILLS = [
  { label: "2024 Season" },
  { label: "All positions" },
  { label: "Offense" },
];

const SEASON_BARS = [
  { year: "2020", height: 42, current: false },
  { year: "2021", height: 55, current: false },
  { year: "2022", height: 38, current: false },
  { year: "2023", height: 50, current: false },
  { year: "2024", height: 72, current: true },
];

const AVATAR_COLORS = [
  "bg-[#c49a22]/20 text-[#f0c040]",
  "bg-emerald-900/40 text-emerald-400",
  "bg-blue-900/40 text-blue-400",
  "bg-rose-900/40 text-rose-400",
  "bg-violet-900/40 text-violet-400",
];

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
      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-[22px] font-medium text-white leading-none">{value}</p>
      {delta && (
        <p className={`text-[10px] mt-1 ${positive ? "text-emerald-400" : "text-red-400"}`}>
          {delta}
        </p>
      )}
    </div>
  );
}

function PlayerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : name.slice(0, 2);
  return <>{initials.toUpperCase()}</>;
}

function displayName(p: Player): string {
  return p.name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Player";
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [activeSeason, setActiveSeason] = useState("2024 Season");
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchPlayers = useCallback(() => playerAPI.getAllPlayers(), []);
  const { data: players, loading, error: apiError } = useApiData(fetchPlayers);

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
  }, [router]);

  // Surface API errors
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
  const rosterPreview = playerList.slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#111]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageLayout
      username={username}
      role={role}
      onLogout={handleLogout}
      navSections={USER_NAV}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      title="Dashboard"
      seasonPills={SEASON_PILLS}
      activeSeason={activeSeason}
      onSeasonChange={setActiveSeason}
    >
      {/* Error toast */}
      {showError && errorMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg shadow-xl max-w-sm">
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
        <StatCard label="Roster size" value={playerList.length || 53} delta="+2 vs 2023" positive />
        <StatCard label="Total TDs" value={42} delta="+8 vs 2023" positive />
        <StatCard label="Pass yds / gm" value={284} delta="-11 vs 2023" positive={false} />
        <StatCard label="Rush yds / gm" value={131} delta="+22 vs 2023" positive />
      </div>

      {/* Leaderboard + Roster */}
      <div className="grid grid-cols-2 gap-3">
        {/* Leaderboard */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
              Stat leaderboard
            </span>
            <button className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              Receiving yds ▾
            </button>
          </div>
          <ul>
            {(rosterPreview.length > 0 ? rosterPreview : Array(5).fill(null)).map((p, i) => {
              const name = p ? displayName(p) : `Player ${i + 1}`;
              const pos = p?.position ?? ["WR", "TE", "WR", "RB", "WR"][i];
              const val = [1204, 892, 721, 528, 374][i];
              const barPct = [100, 74, 60, 44, 31][i];
              const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <li
                  key={p?.id ?? i}
                  className="flex items-center gap-2.5 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px]"
                >
                  <span className={`text-[10px] w-4 text-right shrink-0 ${i < 2 ? "text-[#f0c040] font-medium" : "text-gray-500"}`}>
                    {i + 1}
                  </span>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium shrink-0 ${colorClass}`}>
                    <PlayerInitials name={name} />
                  </span>
                  <span className="flex-1 text-white truncate">{name}</span>
                  <span className="text-[10px] text-gray-500 w-6">{pos}</span>
                  <div className="w-12 h-0.75 bg-white/8 rounded-full overflow-hidden">
                    <div className="h-full bg-[#c49a22] rounded-full" style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="text-[12px] font-medium text-white w-10 text-right">
                    {val.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Roster */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
              Active roster
            </span>
            <button className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              View all →
            </button>
          </div>
          <ul>
            {(rosterPreview.length > 0 ? rosterPreview : Array(5).fill(null)).map((p, i) => {
              const name = p ? displayName(p) : `Player ${i + 1}`;
              const pos = p?.position ?? ["QB", "WR", "RB", "TE", "LB"][i];
              const num = p?.jersey_number ?? [12, 17, 44, 85, 52][i];
              const active = p?.is_active !== false;
              return (
                <li
                  key={p?.id ?? i}
                  className="flex items-center gap-2 px-3 py-1.5 border-b border-white/6 last:border-b-0 text-[12px] hover:bg-white/3 cursor-pointer transition-colors"
                >
                  <span className="w-5.5 h-5.5 rounded flex items-center justify-center text-[9px] font-medium bg-[#1a3d28] text-[#f0c040] shrink-0">
                    {num}
                  </span>
                  <span className="flex-1 text-white truncate">{name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/6 text-gray-400">
                    {pos}
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-emerald-500" : "bg-white/20"}`} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Chart + Comparison */}
      <div className="grid grid-cols-2 gap-3">
        {/* Season bar chart */}
        <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
            <span className="text-[11px] font-medium uppercase tracking-widest text-gray-300">
              Rushing yds by season
            </span>
            <button className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              5-yr view
            </button>
          </div>
          <div className="px-3 py-3">
            <div className="flex items-end gap-1.5 h-20">
              {SEASON_BARS.map((bar) => (
                <div key={bar.year} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm ${bar.current ? "bg-[#c49a22]" : "bg-white/10"}`}
                    style={{ height: `${bar.height}px` }}
                  />
                  <span className={`text-[9px] ${bar.current ? "text-[#f0c040] font-medium" : "text-gray-500"}`}>
                    {bar.year}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c49a22] inline-block" />
                Current season
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <span className="w-1.5 h-1.5 rounded-full bg-white/15 inline-block" />
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
            <button className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer bg-transparent border-none">
              Change players ↗
            </button>
          </div>
          <div className="px-3 py-3">
            <div className="flex gap-2 mb-3">
              <div className="flex-1 text-center">
                <p className="text-[11px] font-medium text-[#f0c040]">
                  {playerList[0] ? displayName(playerList[0]) : "Player A"}
                </p>
                <p className="text-[10px] text-gray-500">
                  {playerList[0]?.position ?? "WR"} · #{playerList[0]?.jersey_number ?? 17}
                </p>
              </div>
              <div className="flex items-center text-[10px] text-gray-500">vs</div>
              <div className="flex-1 text-center">
                <p className="text-[11px] font-medium text-blue-400">
                  {playerList[1] ? displayName(playerList[1]) : "Player B"}
                </p>
                <p className="text-[10px] text-gray-500">
                  {playerList[1]?.position ?? "WR"} · #{playerList[1]?.jersey_number ?? 11}
                </p>
              </div>
            </div>
            {[
              { label: "Rec. yds", l: 100, r: 60, lv: "1,204", rv: "721" },
              { label: "Receptions", l: 80, r: 55, lv: "88", rv: "61" },
              { label: "TDs", l: 90, r: 40, lv: "9", rv: "4" },
              { label: "Avg. yds", l: 65, r: 100, lv: "13.7", rv: "11.8" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] font-medium text-white w-8 text-right">{row.lv}</span>
                <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden flex justify-end">
                  <div className="h-full bg-[#c49a22] rounded-full" style={{ width: `${row.l}%` }} />
                </div>
                <span className="text-[10px] text-gray-500 w-16 text-center shrink-0">{row.label}</span>
                <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${row.r}%` }} />
                </div>
                <span className="text-[11px] font-medium text-white w-8">{row.rv}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}