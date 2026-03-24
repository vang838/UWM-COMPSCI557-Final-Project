from django.core.management.base import BaseCommand
from apps.teams.models import Team
from apps.seasons.models import Season, TeamSeason


class Command(BaseCommand):
    help = "Seed core Team/Season/TeamSeason data (idempotent)."

    def handle(self, *args, **options):
        teams = [
            {"city": "Green Bay", "state": "WI", "team_name": "Packers"},
            {"city": "Chicago", "state": "IL", "team_name": "Bears"},
            {"city": "Detroit", "state": "MI", "team_name": "Lions"},
            {"city": "Minneapolis", "state": "MN", "team_name": "Vikings"},
            {"city": "Los Angeles", "state": "CA", "team_name": "Rams"},
            {"city": "Los Angeles", "state": "CA", "team_name": "Chargers"},
            {"city": "San Francisco", "state": "CA", "team_name": "49ers"},
        ]

        for t in teams:
            Team.objects.get_or_create(**t)

        # 2) Seasons
        s2024, _ = Season.objects.get_or_create(year=2024)
        s2025, _ = Season.objects.get_or_create(year=2025)

        # 3) TeamSeason (example: 2024 alignments)
        alignments_2024 = [
            ("Green Bay", "WI", "Packers", "NFC", "North"),
            ("Chicago", "IL", "Bears", "NFC", "North"),
            ("Detroit", "MI", "Lions", "NFC", "North"),
            ("Minneapolis", "MN", "Vikings", "NFC", "North"),
            ("Los Angeles", "CA", "Rams", "NFC", "West"),
            ("San Francisco", "CA", "49ers", "NFC", "West"),
            ("Los Angeles", "CA", "Chargers", "AFC", "West"),
        ]

        alignments_2025 = [
            ("Philadelphia", "PA", "Eagles", "NFC", "East"),
            ("Dallas", "TX", "Cowboys", "NFC", "East"),
            ("Landover", "MD", "Commanders", "NFC", "East"),
            ("East Rutherford", "NJ", "Giants", "NFC", "East"),
            ("Jacksonville", "FL", "Jaguars", "AFC", "South"),
            ("Houston", "TX", "Texans", "AFC", "South"),
            ("Indianapolis", "IN", "Colts", "AFC", "South"),
            ("Nashville", "TN", "Titans", "AFC", "South"),
        ]

        for city, state, name, conf, div in alignments_2024:
            team, _ = Team.objects.get_or_create(city=city, state=state, team_name=name)
            TeamSeason.objects.update_or_create(
                team=team,
                season=s2024,
                defaults={"conference": conf, "division": div},
            )

        for city, state, name, conf, div in alignments_2025:
            team, _ = Team.objects.get_or_create(city=city, state=state, team_name=name)
            TeamSeason.objects.update_or_create(
                team=team,
                season=s2025,
                defaults={"conference": conf, "division": div},
            )

        self.stdout.write(self.style.SUCCESS("Seeded core Team/Season/TeamSeason data."))