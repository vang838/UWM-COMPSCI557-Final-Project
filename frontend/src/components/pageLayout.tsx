import React from "react";
import Link from "next/link";
import UserAvatar from "@/src/components/UserAvatar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export interface NavItem {
  label: string;
  section: string;
  adminOnly?: boolean;
}

export interface SeasonPill {
  label: string;
}

export interface TeamOption {
  id: string;
  label: string;
}

export interface LayoutTheme {
  sidebarBg: string;
  sidebarText: string;
  sidebarMutedText: string;
  sidebarHoverBg: string;
  accent: string;
  activeBg: string;
  activeText: string;
  dotInactive: string;
  roleBadgeBg: string;
  roleBadgeText: string;
}

interface PageLayoutProps {
  // Auth / identity
  username: string;
  role: string;
  onLogout: () => void;

  // Navigation
  navSections: NavSection[];
  activeSection: string;
  onSectionChange: (section: string) => void;

  // Topbar
  title: string;
  seasonPills?: SeasonPill[];
  activeSeason?: string;
  onSeasonChange?: (season: string) => void;

  // Branding
  teamLabel?: string;

  // Team selector / theming
  theme?: Partial<LayoutTheme>;
  teamOptions?: TeamOption[];
  activeTeamId?: string;
  onTeamChange?: (teamId: string) => void;

  // Page content
  children: React.ReactNode;
}

const DEFAULT_LAYOUT_THEME: LayoutTheme = {
  sidebarBg: "#1a3d28",
  sidebarText: "#ffffff",
  sidebarMutedText: "rgba(255, 255, 255, 0.45)",
  sidebarHoverBg: "rgba(255, 255, 255, 0.05)",
  accent: "#f0c040",
  activeBg: "rgba(196, 154, 34, 0.15)",
  activeText: "#f0c040",
  dotInactive: "rgba(255, 255, 255, 0.25)",
  roleBadgeBg: "rgba(196, 154, 34, 0.2)",
  roleBadgeText: "#f0c040",
};

// ---------------------------------------------------------------------------
// Small helper components
// ---------------------------------------------------------------------------

function NavDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
        active
          ? "bg-[var(--layout-accent)]"
          : "bg-[var(--layout-dot-inactive)]"
      }`}
    />
  );
}

// ---------------------------------------------------------------------------
// PageLayout
// ---------------------------------------------------------------------------

const PageLayout: React.FC<PageLayoutProps> = ({
  username,
  role,
  onLogout,
  navSections,
  activeSection,
  onSectionChange,
  title,
  seasonPills = [],
  activeSeason,
  onSeasonChange,
  teamLabel = "GB Packers · 2024",
  theme = {},
  teamOptions = [],
  activeTeamId,
  onTeamChange,

  children,
}) => {
  const resolvedTheme: LayoutTheme = {
    ...DEFAULT_LAYOUT_THEME,
    ...theme,
  };

  const themeVars = {
    "--layout-sidebar-bg": resolvedTheme.sidebarBg,
    "--layout-sidebar-text": resolvedTheme.sidebarText,
    "--layout-sidebar-muted": resolvedTheme.sidebarMutedText,
    "--layout-sidebar-hover-bg": resolvedTheme.sidebarHoverBg,
    "--layout-accent": resolvedTheme.accent,
    "--layout-active-bg": resolvedTheme.activeBg,
    "--layout-active-text": resolvedTheme.activeText,
    "--layout-dot-inactive": resolvedTheme.dotInactive,
    "--layout-role-bg": resolvedTheme.roleBadgeBg,
    "--layout-role-text": resolvedTheme.roleBadgeText,
  } as React.CSSProperties;

  return (
    <div
      style={themeVars}
      className="flex h-screen overflow-hidden bg-[#111] font-sans"
    >
      {/* SIDEBAR */}
      <aside className="w-44 min-w-[176px] flex flex-col bg-[var(--layout-sidebar-bg)] overflow-hidden">
        {/* Logo */}
        <div className="px-3.5 py-4 border-b border-white/10">
          <p className="text-[15px] font-medium text-[var(--layout-sidebar-text)] tracking-wide">
            GridTracker
          </p>
          <p className="text-[10px] text-[var(--layout-sidebar-muted)] mt-0.5 uppercase tracking-widest">
            {teamLabel}
          </p>
        </div>

        {/* Nav - hides items from non-admins */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map(({ heading, items }) => (
            <div key={heading}>
              <p className="px-3.5 pt-3 pb-1 text-[9px] text-[var(--layout-sidebar-muted)] uppercase tracking-widest">
                {heading}
              </p>

              {items.map((item) => {
                if (item.adminOnly && role !== "admin") return null;

                const active = activeSection === item.section;

                return (
                  <button
                    key={item.section}
                    onClick={() => onSectionChange(item.section)}
                    className={`w-full flex items-center gap-2 py-1.5 text-[12px] transition-colors cursor-pointer border-none bg-transparent text-left
                      ${
                        active
                          ? "bg-[var(--layout-active-bg)] text-[var(--layout-active-text)] border-l-2 border-[var(--layout-accent)] pl-[12px] pr-3.5"
                          : "text-[var(--layout-sidebar-muted)] hover:text-[var(--layout-sidebar-text)] hover:bg-[var(--layout-sidebar-hover-bg)] px-3.5"
                      }`}
                  >
                    <NavDot active={active} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3.5 py-3 border-t border-white/8">
          <span className="inline-block text-[9px] bg-[var(--layout-role-bg)] text-[var(--layout-role-text)] rounded px-1.5 py-0.5 uppercase tracking-widest mb-1">
            {role || "user"}
          </span>
          <p className="text-[11px] text-[var(--layout-sidebar-muted)] truncate">
            {username}
          </p>
        </div>
      </aside>

      {/* Main section */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-2.5 px-4 py-2.5 bg-[#161616] border-b border-white/8">
          <h1 className="flex-1 text-[13px] font-medium text-white">
            {title}
          </h1>

          {/* Team selector */}
          {teamOptions.length > 0 && (
            <select
              value={activeTeamId}
              onChange={(event) => onTeamChange?.(event.target.value)}
              className="px-2.5 py-1 rounded-full text-[11px] border border-white/10 bg-transparent text-gray-300 hover:text-white cursor-pointer"
            >
              {teamOptions.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                  className="bg-[#161616] text-white"
                >
                  {team.label}
                </option>
              ))}
            </select>
          )}

          {/* Season / filter */}
          {seasonPills.map((pill) => (
            <button
              key={pill.label}
              onClick={() => onSeasonChange?.(pill.label)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer bg-transparent
                ${
                  activeSeason === pill.label
                    ? "border-[var(--layout-accent)] text-white"
                    : "border-white/10 text-gray-400 hover:text-white"
                }`}
            >
              {activeSeason === pill.label && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--layout-accent)] inline-block" />
              )}
              {pill.label}
            </button>
          ))}

          {/* Logout */}
          <button
            onClick={onLogout}
            className="ml-2 px-3 py-1 text-[11px] bg-red-900/40 hover:bg-red-800/60 text-red-300 border border-red-800/50 rounded transition-colors cursor-pointer"
          >
            Logout
          </button>

          <Link
              href="/profile"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
              <UserAvatar username={username} size="sm" />
              <span className="hidden md:inline text-xs">{username}</span>
          </Link>
        </header>

        {/* Page-specific content */}
        <main className="flex-1 overflow-y-auto p-3.5 flex flex-col gap-3 bg-[#111]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default PageLayout;