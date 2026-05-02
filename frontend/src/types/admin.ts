export interface PlayerFormData {
    first_name: string;
    last_name: string;
    position: string;
    team: string;
    is_active: boolean;
}

export interface TeamFormData {
    city: string;
    state: string;
    team_name: string;
    conference: string;
    division: string;
    abbreviation: string;
    primary_color: string;
    secondary_color: string;
    text_color: string;
}

export interface SeasonFormData {
    year: string;
}

export interface TeamSeason {
    team_season_id: number;
    team: number;
    season: number;
    season_year?: number;
    team_name?: string;
    team_city?: string;
    team_display_name?: string;
    team_abbreviation?: string;
    conference?: string;
    division?: string;
}

export interface PlayerSeasonRoster {
    roster_id: number;
    player: number;
    player_name?: string;
    player_position?: string;
    team_season: number;
    team_season_id?: number;
    team_id?: number;
    team_display_name?: string;
    team_abbreviation?: string;
    season_id?: number;
    season_year?: number;
    conference?: string;
    division?: string;
    jersey_number?: number | null;
    roster_status?: string;
    is_active?: boolean;
}

export interface RosterFormData {
    player: string;
    jersey_number: string;
    roster_status: string;
    is_active: boolean;
}

export interface StatTypeFormData {
    key: string;
    name: string;
    category: string;
    unit: string;
    description: string;
}

export type SeasonModalMode = "create" | "edit";