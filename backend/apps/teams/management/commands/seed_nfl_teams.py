from django.core.management.base import BaseCommand
from apps.teams.models import Team


class Command(BaseCommand):
    help = "Seed NFL team data, abbreviation, and theme colors."

    def handle(self, *args, **options):
        teams = [
            # AFC East
            {
                "city": "Buffalo",
                "state": "NY",
                "team_name": "Bills",
                "conference": "AFC",
                "division": "East",
                "abbreviation": "BUF",
                "primary_color": "#00338D",
                "secondary_color": "#C60C30",
                "text_color": "#ffffff",
            },
            {
                "city": "Miami",
                "state": "FL",
                "team_name": "Dolphins",
                "conference": "AFC",
                "division": "East",
                "abbreviation": "MIA",
                "primary_color": "#008E97",
                "secondary_color": "#FC4C02",
                "text_color": "#ffffff",
            },
            {
                "city": "New England",
                "state": "MA",
                "team_name": "Patriots",
                "conference": "AFC",
                "division": "East",
                "abbreviation": "NE",
                "primary_color": "#002244",
                "secondary_color": "#C60C30",
                "text_color": "#ffffff",
            },
            {
                "city": "New York",
                "state": "NY",
                "team_name": "Jets",
                "conference": "AFC",
                "division": "East",
                "abbreviation": "NYJ",
                "primary_color": "#125740",
                "secondary_color": "#000000",
                "text_color": "#ffffff",
            },

            # AFC North
            {
                "city": "Baltimore",
                "state": "MD",
                "team_name": "Ravens",
                "conference": "AFC",
                "division": "North",
                "abbreviation": "BAL",
                "primary_color": "#241773",
                "secondary_color": "#9E7C0C",
                "text_color": "#ffffff",
            },
            {
                "city": "Cincinnati",
                "state": "OH",
                "team_name": "Bengals",
                "conference": "AFC",
                "division": "North",
                "abbreviation": "CIN",
                "primary_color": "#FB4F14",
                "secondary_color": "#000000",
                "text_color": "#111827",
            },
            {
                "city": "Cleveland",
                "state": "OH",
                "team_name": "Browns",
                "conference": "AFC",
                "division": "North",
                "abbreviation": "CLE",
                "primary_color": "#311D00",
                "secondary_color": "#FF3C00",
                "text_color": "#ffffff",
            },
            {
                "city": "Pittsburgh",
                "state": "PA",
                "team_name": "Steelers",
                "conference": "AFC",
                "division": "North",
                "abbreviation": "PIT",
                "primary_color": "#101820",
                "secondary_color": "#FFB612",
                "text_color": "#ffffff",
            },

            # AFC South
            {
                "city": "Houston",
                "state": "TX",
                "team_name": "Texans",
                "conference": "AFC",
                "division": "South",
                "abbreviation": "HOU",
                "primary_color": "#03202F",
                "secondary_color": "#A71930",
                "text_color": "#ffffff",
            },
            {
                "city": "Indianapolis",
                "state": "IN",
                "team_name": "Colts",
                "conference": "AFC",
                "division": "South",
                "abbreviation": "IND",
                "primary_color": "#002C5F",
                "secondary_color": "#A2AAAD",
                "text_color": "#ffffff",
            },
            {
                "city": "Jacksonville",
                "state": "FL",
                "team_name": "Jaguars",
                "conference": "AFC",
                "division": "South",
                "abbreviation": "JAX",
                "primary_color": "#101820",
                "secondary_color": "#D7A22A",
                "text_color": "#ffffff",
            },
            {
                "city": "Tennessee",
                "state": "TN",
                "team_name": "Titans",
                "conference": "AFC",
                "division": "South",
                "abbreviation": "TEN",
                "primary_color": "#0C2340",
                "secondary_color": "#4B92DB",
                "text_color": "#ffffff",
            },

            # AFC West
            {
                "city": "Denver",
                "state": "CO",
                "team_name": "Broncos",
                "conference": "AFC",
                "division": "West",
                "abbreviation": "DEN",
                "primary_color": "#002244",
                "secondary_color": "#FB4F14",
                "text_color": "#ffffff",
            },
            {
                "city": "Kansas City",
                "state": "MO",
                "team_name": "Chiefs",
                "conference": "AFC",
                "division": "West",
                "abbreviation": "KC",
                "primary_color": "#E31837",
                "secondary_color": "#FFB81C",
                "text_color": "#ffffff",
            },
            {
                "city": "Las Vegas",
                "state": "NV",
                "team_name": "Raiders",
                "conference": "AFC",
                "division": "West",
                "abbreviation": "LV",
                "primary_color": "#000000",
                "secondary_color": "#A5ACAF",
                "text_color": "#ffffff",
            },
            {
                "city": "Los Angeles",
                "state": "CA",
                "team_name": "Chargers",
                "conference": "AFC",
                "division": "West",
                "abbreviation": "LAC",
                "primary_color": "#FFC20E",
                "secondary_color": "#0080C6",
                "text_color": "#111827",
            },

            # NFC East
            {
                "city": "Dallas",
                "state": "TX",
                "team_name": "Cowboys",
                "conference": "NFC",
                "division": "East",
                "abbreviation": "DAL",
                "primary_color": "#003594",
                "secondary_color": "#869397",
                "text_color": "#ffffff",
            },
            {
                "city": "New York",
                "state": "NY",
                "team_name": "Giants",
                "conference": "NFC",
                "division": "East",
                "abbreviation": "NYG",
                "primary_color": "#0B2265",
                "secondary_color": "#A71930",
                "text_color": "#ffffff",
            },
            {
                "city": "Philadelphia",
                "state": "PA",
                "team_name": "Eagles",
                "conference": "NFC",
                "division": "East",
                "abbreviation": "PHI",
                "primary_color": "#004C54",
                "secondary_color": "#A5ACAF",
                "text_color": "#ffffff",
            },
            {
                "city": "Washington",
                "state": "DC",
                "team_name": "Commanders",
                "conference": "NFC",
                "division": "East",
                "abbreviation": "WAS",
                "primary_color": "#5A1414",
                "secondary_color": "#FFB612",
                "text_color": "#ffffff",
            },

            # NFC North
            {
                "city": "Chicago",
                "state": "IL",
                "team_name": "Bears",
                "conference": "NFC",
                "division": "North",
                "abbreviation": "CHI",
                "primary_color": "#0B162A",
                "secondary_color": "#C83803",
                "text_color": "#ffffff",
            },
            {
                "city": "Detroit",
                "state": "MI",
                "team_name": "Lions",
                "conference": "NFC",
                "division": "North",
                "abbreviation": "DET",
                "primary_color": "#0076B6",
                "secondary_color": "#B0B7BC",
                "text_color": "#ffffff",
            },
            {
                "city": "Green Bay",
                "state": "WI",
                "team_name": "Packers",
                "conference": "NFC",
                "division": "North",
                "abbreviation": "GB",
                "primary_color": "#203731",
                "secondary_color": "#FFB612",
                "text_color": "#ffffff",
            },
            {
                "city": "Minnesota",
                "state": "MN",
                "team_name": "Vikings",
                "conference": "NFC",
                "division": "North",
                "abbreviation": "MIN",
                "primary_color": "#4F2683",
                "secondary_color": "#FFC62F",
                "text_color": "#ffffff",
            },

            # NFC South
            {
                "city": "Atlanta",
                "state": "GA",
                "team_name": "Falcons",
                "conference": "NFC",
                "division": "South",
                "abbreviation": "ATL",
                "primary_color": "#A71930",
                "secondary_color": "#000000",
                "text_color": "#ffffff",
            },
            {
                "city": "Carolina",
                "state": "NC",
                "team_name": "Panthers",
                "conference": "NFC",
                "division": "South",
                "abbreviation": "CAR",
                "primary_color": "#0085CA",
                "secondary_color": "#101820",
                "text_color": "#ffffff",
            },
            {
                "city": "New Orleans",
                "state": "LA",
                "team_name": "Saints",
                "conference": "NFC",
                "division": "South",
                "abbreviation": "NO",
                "primary_color": "#101820",
                "secondary_color": "#D3BC8D",
                "text_color": "#ffffff",
            },
            {
                "city": "Tampa Bay",
                "state": "FL",
                "team_name": "Buccaneers",
                "conference": "NFC",
                "division": "South",
                "abbreviation": "TB",
                "primary_color": "#D50A0A",
                "secondary_color": "#34302B",
                "text_color": "#ffffff",
            },

            # NFC West
            {
                "city": "Arizona",
                "state": "AZ",
                "team_name": "Cardinals",
                "conference": "NFC",
                "division": "West",
                "abbreviation": "ARI",
                "primary_color": "#97233F",
                "secondary_color": "#FFB612",
                "text_color": "#ffffff",
            },
            {
                "city": "Los Angeles",
                "state": "CA",
                "team_name": "Rams",
                "conference": "NFC",
                "division": "West",
                "abbreviation": "LAR",
                "primary_color": "#003594",
                "secondary_color": "#FFA300",
                "text_color": "#ffffff",
            },
            {
                "city": "San Francisco",
                "state": "CA",
                "team_name": "49ers",
                "conference": "NFC",
                "division": "West",
                "abbreviation": "SF",
                "primary_color": "#AA0000",
                "secondary_color": "#B3995D",
                "text_color": "#ffffff",
            },
            {
                "city": "Seattle",
                "state": "WA",
                "team_name": "Seahawks",
                "conference": "NFC",
                "division": "West",
                "abbreviation": "SEA",
                "primary_color": "#002244",
                "secondary_color": "#69BE28",
                "text_color": "#ffffff",
            },
        ]

        created_count = 0
        updated_count = 0

        for team_data in teams:
            team_defaults = {
                key: value
                for key, value in team_data.items()
                if key not in {"conference", "division"}
            }

            team, created = Team.objects.update_or_create(
                team_name=team_data["team_name"],
                defaults=team_defaults,
            )

            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded NFL teams. Created: {created_count}, Updated: {updated_count}"
            )
        )