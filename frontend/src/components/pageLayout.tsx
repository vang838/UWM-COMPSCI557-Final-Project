import React from "react";

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

  // Branding (defaults to Packers, overridable for multi-team support)
  teamLabel?: string;

  // Page content
  children: React.ReactNode;
}

// Sub-components (file-private, not exported)
function NavDot({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
        active ? "bg-[#f0c040]" : "bg-white/25"
      }`}
    />
  );
}


// PageLayout
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
  children,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#111] font-sans">
      {/* SIDEBAR */}
      <aside className="w-44 min-w-[176px] flex flex-col bg-[#1a3d28] overflow-hidden">
        {/* Logo */}
        <div className="px-3.5 py-4 border-b border-white/10">
          <p className="text-[15px] font-medium text-white tracking-wide">
            GridTracker
          </p>
          <p className="text-[10px] text-white/35 mt-0.5 uppercase tracking-widest">
            {teamLabel}
          </p>
        </div>

        {/* Nav - hides items from non-admins */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map(({ heading, items }) => (
            <div key={heading}>
              <p className="px-3.5 pt-3 pb-1 text-[9px] text-white/30 uppercase tracking-widest">
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
                          ? "bg-[#c49a22]/15 text-[#f0c040] border-l-2 border-[#f0c040] pl-[12px] pr-3.5"
                          : "text-white/55 hover:text-white/90 hover:bg-white/5 px-3.5"
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
          <span className="inline-block text-[9px] bg-[#c49a22]/20 text-[#f0c040] rounded px-1.5 py-0.5 uppercase tracking-widest mb-1">
            {role || "user"}
          </span>
          <p className="text-[11px] text-white/45 truncate">{username}</p>
        </div>
      </aside>

      {/* main section */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-2.5 px-4 py-2.5 bg-[#161616] border-b border-white/8">
          <h1 className="flex-1 text-[13px] font-medium text-white">{title}</h1>

          {/* Season / filter */}
          {seasonPills.map((pill) => (
            <button
              key={pill.label}
              onClick={() => onSeasonChange?.(pill.label)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer bg-transparent
                ${
                  activeSeason === pill.label
                    ? "border-[#c49a22] text-white"
                    : "border-white/10 text-gray-400 hover:text-white"
                }`}
            >
              {activeSeason === pill.label && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#c49a22] inline-block" />
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