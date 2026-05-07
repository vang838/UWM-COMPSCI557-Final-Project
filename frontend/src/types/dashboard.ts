export interface PlayerSeasonStat {
    player_season_stat_id?: number;
    player_roster?: number;
    player_id?: number;
    player_name?: string;
    position?: string;
    team_id?: number;
    team_name?: string;
    team_abbreviation?: string;
    season_id?: number;
    season_year?: number | string;
    stat_type?: number;
    stat_type_key?: string;
    stat_type_name?: string;
    stat_type_category?: string;
    stat_type_unit?: string;
    value?: number | string;
    is_primary?: boolean;
    display_order?: number;
}

export interface Player {
    id?: number;
    player_id?: number;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    jersey_number?: number | string;
    team?: number | string;
    team_name?: string;
    date_of_birth?: string | null;
    age?: number | null;
    college?: string;
    height?: number | string | null;
    weight?: number | string | null;
    headshot_url?: string;
    is_active?: boolean;
    season_stats?: PlayerSeasonStat[];
}

export interface Season {
    id?: number;
    season_id?: number;
    year?: number | string;
}

export interface Team {
    id?: number;
    team_id?: number;
    city?: string;
    state?: string;
    team_name?: string;
    display_name?: string;
    abbreviation?: string;
    primary_color?: string;
    secondary_color?: string;
    text_color?: string;
}

export interface StatType {
    stat_type_id?: number;
    key?: string;
    name?: string;
    category?: string;
    unit?: string;
    description?: string;
}

export interface CoachSeasonAssignment {
    assignment_id?: number;
    coach?: number;
    coach_first_name?: string;
    coach_last_name?: string;
    coach_full_name?: string;
    team_season?: number;
    team_id?: number;
    team_name?: string;
    team_abbreviation?: string;
    season_id?: number;
    season_year?: number | string;
    conference?: string;
    division?: string;
    role?: string;
    is_active?: boolean;
    start_date?: string | null;
    end_date?: string | null;
}

export interface LeaderboardRow {
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

export interface PlayerComparisonReportPlayer {
    player_id: number;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    position?: string;
}

export interface PlayerComparisonReportRow {
    stat_key: string;
    stat_name: string;
    stat_category: string;
    stat_unit?: string;
    left_value: number;
    right_value: number;
    left_percent: number;
    right_percent: number;
}

export interface PlayerComparisonReport {
    team_id: number;
    year: number;
    left_player: PlayerComparisonReportPlayer;
    right_player: PlayerComparisonReportPlayer;
    rows: PlayerComparisonReportRow[];
}

export interface TopPerformer {
    label: string;
    playerName: string;
    position?: string;
    statName: string;
    value: number;
    unit?: string;
}