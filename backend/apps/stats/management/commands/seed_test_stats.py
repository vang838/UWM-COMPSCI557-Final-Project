# backend/apps/stats/management/commands/seed_test_stats.py

from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.players.models import Player
from apps.seasons.models import Season, TeamSeason, PlayerSeasonRoster
from apps.stats.models import StatType, PositionStatType, PlayerSeasonStat
from apps.teams.models import Team


STAT_TYPES = [
    {
        "key": "passing_yards",
        "name": "Passing Yards",
        "category": "passing",
        "unit": "yards",
        "description": "Total yards gained through passing.",
    },
    {
        "key": "passing_touchdowns",
        "name": "Passing Touchdowns",
        "category": "passing",
        "unit": "count",
        "description": "Total passing touchdowns.",
    },
    {
        "key": "interceptions_thrown",
        "name": "Interceptions Thrown",
        "category": "passing",
        "unit": "count",
        "description": "Passes intercepted by the defense.",
    },
    {
        "key": "rushing_yards",
        "name": "Rushing Yards",
        "category": "rushing",
        "unit": "yards",
        "description": "Total yards gained by rushing.",
    },
    {
        "key": "rushing_touchdowns",
        "name": "Rushing Touchdowns",
        "category": "rushing",
        "unit": "count",
        "description": "Total rushing touchdowns.",
    },
    {
        "key": "receptions",
        "name": "Receptions",
        "category": "receiving",
        "unit": "count",
        "description": "Total completed catches.",
    },
    {
        "key": "receiving_yards",
        "name": "Receiving Yards",
        "category": "receiving",
        "unit": "yards",
        "description": "Total receiving yards.",
    },
    {
        "key": "receiving_touchdowns",
        "name": "Receiving Touchdowns",
        "category": "receiving",
        "unit": "count",
        "description": "Total receiving touchdowns.",
    },
    {
        "key": "tackles",
        "name": "Tackles",
        "category": "defense",
        "unit": "count",
        "description": "Total tackles.",
    },
    {
        "key": "sacks",
        "name": "Sacks",
        "category": "defense",
        "unit": "count",
        "description": "Total quarterback sacks.",
    },
    {
        "key": "interceptions",
        "name": "Interceptions",
        "category": "defense",
        "unit": "count",
        "description": "Passes intercepted by the player.",
    },
    {
        "key": "forced_fumbles",
        "name": "Forced Fumbles",
        "category": "defense",
        "unit": "count",
        "description": "Fumbles caused by the player.",
    },
    {
        "key": "field_goals_made",
        "name": "Field Goals Made",
        "category": "kicking",
        "unit": "count",
        "description": "Successful field goals.",
    },
    {
        "key": "extra_points_made",
        "name": "Extra Points Made",
        "category": "kicking",
        "unit": "count",
        "description": "Successful extra point attempts.",
    },
]


POSITION_STAT_MAPPINGS = {
    "QB": [
        "passing_yards",
        "passing_touchdowns",
        "interceptions_thrown",
        "rushing_yards",
    ],
    "RB": [
        "rushing_yards",
        "rushing_touchdowns",
        "receptions",
        "receiving_yards",
    ],
    "WR": [
        "receptions",
        "receiving_yards",
        "receiving_touchdowns",
        "rushing_yards",
    ],
    "TE": [
        "receptions",
        "receiving_yards",
        "receiving_touchdowns",
    ],
    "LB": [
        "tackles",
        "sacks",
        "interceptions",
        "forced_fumbles",
    ],
    "DT": [
        "tackles",
        "sacks",
        "forced_fumbles",
        "interceptions",
    ],
    "CB": [
        "tackles",
        "interceptions",
        "forced_fumbles",
    ],
    "S": [
        "tackles",
        "interceptions",
        "forced_fumbles",
    ],
    "K": [
        "field_goals_made",
        "extra_points_made",
    ],
}


TEST_PLAYERS = [
    {
        "team_abbreviation": "GB",
        "first_name": "Jordan",
        "last_name": "Love",
        "position": "QB",
        "jersey_number": 10,
        "stats": {
            "passing_yards": 3389,
            "passing_touchdowns": 25,
            "interceptions_thrown": 11,
            "rushing_yards": 83,
        },
    },
    {
        "team_abbreviation": "GB",
        "first_name": "Josh",
        "last_name": "Jacobs",
        "position": "RB",
        "jersey_number": 8,
        "stats": {
            "rushing_yards": 1329,
            "rushing_touchdowns": 15,
            "receptions": 36,
            "receiving_yards": 342,
        },
    },
    {
        "team_abbreviation": "GB",
        "first_name": "Christian",
        "last_name": "Watson",
        "position": "WR",
        "jersey_number": 9,
        "stats": {
            "receptions": 29,
            "receiving_yards": 620,
            "receiving_touchdowns": 2,
            "rushing_yards": 14,
        },
    },
    {
        "team_abbreviation": "GB",
        "first_name": "Quay",
        "last_name": "Walker",
        "position": "LB",
        "jersey_number": 7,
        "stats": {
            "tackles": 102,
            "sacks": 2.5,
            "interceptions": 1,
            "forced_fumbles": 1,
        },
    },
    {
        "team_abbreviation": "GB",
        "first_name": "Kenny",
        "last_name": "Clark",
        "position": "DT",
        "jersey_number": 97,
        "stats": {
            "tackles": 37,
            "sacks": 1,
            "forced_fumbles": 1,
            "interceptions": 1,
        },
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "Josh",
        "last_name": "Allen",
        "position": "QB",
        "jersey_number": 17,
        "stats": {
            "passing_yards": 3710,
            "passing_touchdowns": 28,
            "interceptions_thrown": 6,
            "rushing_yards": 531,
        },
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "James",
        "last_name": "Cook",
        "position": "RB",
        "jersey_number": 4,
        "stats": {
            "rushing_yards": 1009,
            "rushing_touchdowns": 16,
            "receptions": 32,
            "receiving_yards": 258,
        },
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "Khalil",
        "last_name": "Shakir",
        "position": "WR",
        "jersey_number": 10,
        "stats": {
            "receptions": 76,
            "receiving_yards": 821,
            "receiving_touchdowns": 4,
            "rushing_yards": 5,
        },
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "Terrel",
        "last_name": "Bernard",
        "position": "LB",
        "jersey_number": 43,
        "stats": {
            "tackles": 104,
            "sacks": 1,
            "interceptions": 2,
            "forced_fumbles": 1,
        },
    },
    {
        "team_abbreviation": "BUF",
        "first_name": "Ed",
        "last_name": "Oliver",
        "position": "DT",
        "jersey_number": 91,
        "stats": {
            "tackles": 48,
            "sacks": 3,
            "forced_fumbles": 1,
            "interceptions": 0,
        },
    },
]


class Command(BaseCommand):
    help = "Seed sample stat types, position stat mappings, rosters, and player stats for testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            default=2024,
            help="Season year to seed test data for.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        year = options["year"]

        season, _ = Season.objects.get_or_create(year=year)

        stat_type_lookup = self.seed_stat_types()
        self.seed_position_stat_types(stat_type_lookup)

        created_players = 0
        updated_players = 0
        created_rosters = 0
        updated_rosters = 0
        created_stats = 0
        updated_stats = 0

        for player_data in TEST_PLAYERS:
            team = self.get_team(player_data["team_abbreviation"])

            team_season, _ = TeamSeason.objects.update_or_create(
                team=team,
                season=season,
                defaults={
                    "conference": getattr(team, "conference", "") or "",
                    "division": getattr(team, "division", "") or "",
                },
            )

            player, player_created = Player.objects.update_or_create(
                first_name=player_data["first_name"],
                last_name=player_data["last_name"],
                defaults={
                    "position": player_data["position"],
                    "team": team,
                    "is_active": True,
                },
            )

            if player_created:
                created_players += 1
            else:
                updated_players += 1

            roster, roster_created = PlayerSeasonRoster.objects.update_or_create(
                player=player,
                team_season=team_season,
                defaults={
                    "jersey_number": player_data["jersey_number"],
                    "roster_status": "Active",
                    "is_active": True,
                },
            )

            if roster_created:
                created_rosters += 1
            else:
                updated_rosters += 1

            for stat_key, raw_value in player_data["stats"].items():
                stat_type = stat_type_lookup[stat_key]

                _, stat_created = PlayerSeasonStat.objects.update_or_create(
                    player_roster=roster,
                    stat_type=stat_type,
                    defaults={
                        "value": Decimal(str(raw_value)),
                    },
                )

                if stat_created:
                    created_stats += 1
                else:
                    updated_stats += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Seeded test stats successfully.\n"
                f"Season: {year}\n"
                f"Players created: {created_players}, updated: {updated_players}\n"
                f"Rosters created: {created_rosters}, updated: {updated_rosters}\n"
                f"Stats created: {created_stats}, updated: {updated_stats}"
            )
        )

    def seed_stat_types(self):
        lookup = {}

        for stat_data in STAT_TYPES:
            stat_type, _ = StatType.objects.update_or_create(
                key=stat_data["key"],
                defaults={
                    "name": stat_data["name"],
                    "category": stat_data["category"],
                    "unit": stat_data["unit"],
                    "description": stat_data["description"],
                },
            )

            lookup[stat_type.key] = stat_type

        return lookup

    def seed_position_stat_types(self, stat_type_lookup):
        for position, stat_keys in POSITION_STAT_MAPPINGS.items():
            for index, stat_key in enumerate(stat_keys):
                stat_type = stat_type_lookup[stat_key]

                PositionStatType.objects.update_or_create(
                    position=position,
                    stat_type=stat_type,
                    defaults={
                        "display_order": index + 1,
                        "is_primary": True,
                    },
                )

    def get_team(self, abbreviation):
        try:
            return Team.objects.get(abbreviation=abbreviation)
        except Team.DoesNotExist:
            raise CommandError(
                f"Team with abbreviation '{abbreviation}' does not exist. "
                "Run your NFL team seed command first."
            )