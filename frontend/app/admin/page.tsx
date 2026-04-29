'use client';

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/src/components/LoadingSpinner";
import PageLayout, { NavSection } from "@/src/components/pageLayout";


import { playerAPI } from "@/src/api/players";
import { seasonAPI } from "@/src/api/seasons";
import { teamAPI } from "@/src/api/teams";

import { useApiData } from "@/src/hooks/useApiData";

// Types
interface Player {
  id?: number;
  player_id?: number;
  first_name?: string;
  last_name?: string;
  name?: string;
  position?: string;
  jersey_number?: number | string;
  team?: number | string;
  is_active?: boolean;
}

interface Season {
  id?: number;
  season_id?: number;
  year?: number | string;
}

interface Team {
  id?: number;
  team_id?: number;
  city?: string;
  state?: string;
  team_name?: string;
  display_name?: string;
  conference?: string;
  division?: string;
  abbreviation?: string;
  primary_color?: string;
  secondary_color?: string;
  text_color?: string;
}

// Nav config
const ADMIN_NAV: NavSection[] = [
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
  {
    heading: "Admin",
    items: [
      { label: "Manage seasons", section: "manage-seasons", adminOnly: true },
      { label: "User roles", section: "user-roles", adminOnly: true },
    ],
  },
];

// Helpers
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

function displayPlayerName(player: Player): string {
  return (
    player.name ||
    `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim() ||
    "Unknown player"
  );
}

function getPlayerId(player: Player): number | string {
  return player.id ?? player.player_id ?? crypto.randomUUID();
}

function noData(value: unknown): string | number {
  if (value === null || value === undefined || value === "") {
    return "No data";
  }

  return value as string | number;
}

function getSectionTitle(section: string): string {
  const titles: Record<string, string> = {
    dashboard: "Admin Dashboard",
    "season-summary": "Season Summary",
    players: "Manage Players",
    coaches: "Manage Coaches",
    "team-roster": "Team Roster",
    "player-stats": "Player Stats",
    "stat-types": "Stat Types",
    leaderboard: "Leaderboard",
    comparison: "Player Comparison",
    "manage-seasons": "Manage Seasons",
    "user-roles": "User Roles",
  };

  return titles[section] ?? "Admin Dashboard";
}

// Small components
function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-lg px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>
      <p className="text-[22px] font-medium text-white leading-none">
        {value}
      </p>
    </div>
  );
}

function AdminActionCard({
  title,
  description,
  actions,
  onSectionChange,
}: {
  title: string;
  description: string;
  actions: { label: string; section?: string }[];
  onSectionChange: (section: string) => void;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-lg p-4">
      <p className="text-[13px] font-medium text-white mb-1">{title}</p>
      <p className="text-[11px] text-gray-500 mb-3">{description}</p>

      <div className="flex flex-wrap gap-1.5">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => {
              if (action.section) {
                onSectionChange(action.section);
              }
            }}
            className="text-[10px] px-2.5 py-1 rounded border border-white/10 text-gray-300 hover:border-[#c49a22]/50 hover:text-[#f0c040] transition-colors cursor-pointer bg-transparent"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptySection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-white/8 rounded-lg p-6 min-h-[220px] flex flex-col items-center justify-center text-center">
      <p className="text-[14px] font-medium text-white mb-1">{title}</p>
      <p className="text-[12px] text-gray-500 max-w-md">{description}</p>
    </div>
  );
}

function PlayerRecordsTable({ players }: { players: Player[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        Player records ({players.length})
      </p>

      <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
          <span>Name</span>
          <span>Position</span>
          <span>Team</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {players.length > 0 ? (
          players.map((player) => {
            const active = player.is_active !== false;

            return (
              <div
                key={getPlayerId(player)}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]"
              >
                <span className="text-white font-medium truncate">
                  {displayPlayerName(player)}
                </span>

                <span className="text-gray-400">
                  {player.position || "—"}
                </span>

                <span className="text-gray-400">
                  {player.team ? `#${player.team}` : "—"}
                </span>

                <span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
                      active
                        ? "bg-emerald-900/40 text-emerald-400"
                        : "bg-white/5 text-gray-500"
                    }`}
                  >
                    <span
                      className={`w-1 h-1 rounded-full inline-block ${
                        active ? "bg-emerald-400" : "bg-gray-600"
                      }`}
                    />
                    {active ? "Active" : "Inactive"}
                  </span>
                </span>

                <div className="flex gap-1.5">
                  <button className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">
                    Edit
                  </button>
                  <button className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent">
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-3 py-6 text-center text-[12px] text-gray-500">
            No players found.
          </div>
        )}
      </div>
    </div>
  );
}

function AdminOverview({
  players,
  seasons,
  onSectionChange,
}: {
  players: Player[];
  seasons: Season[];
  onSectionChange: (section: string) => void;
}) {
  const activePlayers = players.filter((player) => player.is_active !== false);

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="Total players" value={players.length} />
        <StatCard label="Active players" value={activePlayers.length} />
        <StatCard label="Teams" value="No data" />
        <StatCard label="Seasons" value={noData(seasons.length)} />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
          Management
        </p>

        <div className="grid grid-cols-2 gap-3">
          <AdminActionCard
            title="Players"
            description="Manage player records, roster status, and player profile information."
            actions={[
              { label: "View players", section: "players" },
              { label: "Add player", section: "players" },
              { label: "Edit player", section: "players" },
            ]}
            onSectionChange={onSectionChange}
          />

          <AdminActionCard
            title="Teams & seasons"
            description="Manage seasons, teams, and roster assignments."
            actions={[
              { label: "Manage seasons", section: "manage-seasons" },
              { label: "Team roster", section: "team-roster" },
            ]}
            onSectionChange={onSectionChange}
          />

          <AdminActionCard
            title="Coaches"
            description="Track coaching staff history and assignments by team or season."
            actions={[
              { label: "View coaches", section: "coaches" },
              { label: "Add coach", section: "coaches" },
            ]}
            onSectionChange={onSectionChange}
          />

          <AdminActionCard
            title="Statistics"
            description="Create stat types and enter or correct player season statistics."
            actions={[
              { label: "Player stats", section: "player-stats" },
              { label: "Stat types", section: "stat-types" },
              { label: "Leaderboard", section: "leaderboard" },
            ]}
            onSectionChange={onSectionChange}
          />
        </div>
      </div>

      <PlayerRecordsTable players={players.slice(0, 10)} />

      {players.length > 10 && (
        <div className="px-3 py-2 border border-white/8 rounded-lg text-[11px] text-gray-500 text-center bg-[#1a1a1a]">
          Showing 10 of {players.length} players —{" "}
          <button
            onClick={() => onSectionChange("players")}
            className="text-[#f0c040] hover:underline cursor-pointer bg-transparent border-none"
          >
            view all
          </button>
        </div>
      )}
    </>
  );
}

function SeasonsPanel({ seasons }: { seasons: Season[] }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        Seasons ({seasons.length})
      </p>

      <div className="bg-[#1a1a1a] border border-white/8 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-3 py-2 border-b border-white/8 text-[10px] uppercase tracking-widest text-gray-500">
          <span>Season ID</span>
          <span>Year</span>
          <span>Actions</span>
        </div>

        {seasons.length > 0 ? (
          seasons.map((season) => (
            <div
              key={season.season_id ?? season.id ?? season.year}
              className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center px-3 py-2 border-b border-white/6 last:border-b-0 hover:bg-white/3 transition-colors text-[12px]"
            >
              <span className="text-gray-400">
                {season.season_id ?? season.id ?? "—"}
              </span>
              <span className="text-white font-medium">{season.year}</span>
              <div className="flex gap-1.5">
                <button className="text-[10px] px-2 py-0.5 rounded border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors cursor-pointer bg-transparent">
                  Edit
                </button>
                <button className="text-[10px] px-2 py-0.5 rounded border border-red-900/50 text-red-500 hover:border-red-700 hover:text-red-300 transition-colors cursor-pointer bg-transparent">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-3 py-6 text-center text-[12px] text-gray-500">
            No seasons found.
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [activeSection, setActiveSection] = useState("dashboard");

  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [seasons, setSeasons] = useState<Season[]>([]);

  const fetchPlayers = useCallback(() => playerAPI.getAllPlayers(), []);
  const {
    data: playersResponse,
    loading,
    error: apiError,
  } = useApiData(fetchPlayers);

  const playerList = useMemo(
    () => normalizeApiList<Player>(playersResponse ?? []),
    [playersResponse]
  );

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
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    const fetchSeasons = async () => {
      const seasonData = await safeApiCall<unknown[]>(
        () => seasonAPI.getAllSeasons(),
        []
      );

      const seasonList = normalizeApiList<Season>(seasonData)
        .filter((season) => season.year !== undefined && season.year !== null)
        .sort((a, b) => Number(b.year) - Number(a.year));

      setSeasons(seasonList);
    };

    fetchSeasons();
  }, [authChecked]);

  useEffect(() => {
    if (apiError) {
      setErrorMsg(apiError);
      setShowError(true);

      const timeout = setTimeout(() => setShowError(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [apiError]);

  const showTemporaryError = useCallback((message: string) => {
    setErrorMsg(message);
    setShowError(true);

    const timeout = setTimeout(() => setShowError(false), 5000);
    return () => clearTimeout(timeout);
  }, []);

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

  const renderAdminContent = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <AdminOverview
            players={playerList}
            seasons={seasons}
            onSectionChange={setActiveSection}
          />
        );

      case "players":
        return <PlayerRecordsTable players={playerList} />;

      case "manage-seasons":
        return <SeasonsPanel seasons={seasons} />;

      case "season-summary":
        return (
          <EmptySection
            title="Season summary"
            description="This section should summarize season-level performance once the backend season summary API is available."
          />
        );

      case "coaches":
        return (
          <EmptySection
            title="Coaches"
            description="This section should list coaching staff and allow admin-only coach management once the coaches API is available."
          />
        );

      case "team-roster":
        return (
          <EmptySection
            title="Team roster"
            description="This section should show roster assignments by team and season once the teams and roster APIs are available."
          />
        );

      case "player-stats":
        return (
          <EmptySection
            title="Player stats"
            description="This section should let admins review, enter, and correct player statistics."
          />
        );

      case "stat-types":
        return (
          <EmptySection
            title="Stat types"
            description="This section should manage the supported statistic categories used by the dashboard and reports."
          />
        );

      case "leaderboard":
        return (
          <EmptySection
            title="Leaderboard"
            description="This section should show ranked player statistics once the leaderboard API is available."
          />
        );

      case "comparison":
        return (
          <EmptySection
            title="Player comparison"
            description="This section should compare two selected players once the comparison API is available."
          />
        );

      case "user-roles":
        return (
          <EmptySection
            title="User roles"
            description="This section should manage user roles and permissions. Keep this admin-only."
          />
        );

      default:
        return (
          <AdminOverview
            players={playerList}
            seasons={seasons}
            onSectionChange={setActiveSection}
          />
        );
    }
  };

  if (!authChecked || loading) {
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
      navSections={ADMIN_NAV}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      title={getSectionTitle(activeSection)}
    >
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

      {renderAdminContent()}
    </PageLayout>
  );
}