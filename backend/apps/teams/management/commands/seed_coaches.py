"""
Django management command: seed NFL coaches for 2022, 2023, and 2024.

Place this file at:
backend/apps/teams/management/commands/seed_coaches.py

Run from the backend folder:
python manage.py seed_coaches

Assumptions:
- Team rows already exist.
- Season rows already exist.
- TeamSeason rows already exist for each Team + Season.
- Team.team_name uses short names such as "Packers", "Bears", "49ers", etc.

This command creates/updates:
- Coach
- CoachSeasonAssignment

The historical relationship is stored in CoachSeasonAssignment.
The legacy Coach.team and Coach.role fields are only updated for 2024 display convenience.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.seasons.models import TeamSeason
from apps.teams.models import Coach, CoachSeasonAssignment


ROLE_HEAD_COACH = "Head Coach"
ROLE_OFFENSIVE_COORDINATOR = "Offensive Coordinator"
ROLE_DEFENSIVE_COORDINATOR = "Defensive Coordinator"
ROLE_SPECIAL_TEAMS_COORDINATOR = "Special Teams Coordinator"


# Data format:
# year -> team_name -> role -> coach full name
#
# Notes:
# - Some NFL teams did not officially use an offensive coordinator or defensive coordinator title
#   in certain years. For this class-project seed, the main play-caller or closest equivalent
#   is used so every team-season has the same four role rows.
# - Some teams had interim coaches or co-coordinators. This simplified seed stores one coach
#   per role per team-season to match the four-role structure shown in your admin page.
COACHING_STAFFS = {
    2022: {
        "Cardinals": {
            ROLE_HEAD_COACH: "Kliff Kingsbury",
            ROLE_OFFENSIVE_COORDINATOR: "Kliff Kingsbury",
            ROLE_DEFENSIVE_COORDINATOR: "Vance Joseph",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Jeff Rodgers",
        },
        "Falcons": {
            ROLE_HEAD_COACH: "Arthur Smith",
            ROLE_OFFENSIVE_COORDINATOR: "Dave Ragone",
            ROLE_DEFENSIVE_COORDINATOR: "Dean Pees",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Marquice Williams",
        },
        "Ravens": {
            ROLE_HEAD_COACH: "John Harbaugh",
            ROLE_OFFENSIVE_COORDINATOR: "Greg Roman",
            ROLE_DEFENSIVE_COORDINATOR: "Mike Macdonald",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Chris Horton",
        },
        "Bills": {
            ROLE_HEAD_COACH: "Sean McDermott",
            ROLE_OFFENSIVE_COORDINATOR: "Ken Dorsey",
            ROLE_DEFENSIVE_COORDINATOR: "Leslie Frazier",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Matthew Smiley",
        },
        "Panthers": {
            ROLE_HEAD_COACH: "Matt Rhule",
            ROLE_OFFENSIVE_COORDINATOR: "Ben McAdoo",
            ROLE_DEFENSIVE_COORDINATOR: "Phil Snow",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Chris Tabor",
        },
        "Bears": {
            ROLE_HEAD_COACH: "Matt Eberflus",
            ROLE_OFFENSIVE_COORDINATOR: "Luke Getsy",
            ROLE_DEFENSIVE_COORDINATOR: "Alan Williams",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Richard Hightower",
        },
        "Bengals": {
            ROLE_HEAD_COACH: "Zac Taylor",
            ROLE_OFFENSIVE_COORDINATOR: "Brian Callahan",
            ROLE_DEFENSIVE_COORDINATOR: "Lou Anarumo",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Darrin Simmons",
        },
        "Browns": {
            ROLE_HEAD_COACH: "Kevin Stefanski",
            ROLE_OFFENSIVE_COORDINATOR: "Alex Van Pelt",
            ROLE_DEFENSIVE_COORDINATOR: "Joe Woods",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Mike Priefer",
        },
        "Cowboys": {
            ROLE_HEAD_COACH: "Mike McCarthy",
            ROLE_OFFENSIVE_COORDINATOR: "Kellen Moore",
            ROLE_DEFENSIVE_COORDINATOR: "Dan Quinn",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "John Fassel",
        },
        "Broncos": {
            ROLE_HEAD_COACH: "Nathaniel Hackett",
            ROLE_OFFENSIVE_COORDINATOR: "Justin Outten",
            ROLE_DEFENSIVE_COORDINATOR: "Ejiro Evero",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Dwayne Stukes",
        },
        "Lions": {
            ROLE_HEAD_COACH: "Dan Campbell",
            ROLE_OFFENSIVE_COORDINATOR: "Ben Johnson",
            ROLE_DEFENSIVE_COORDINATOR: "Aaron Glenn",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Dave Fipp",
        },
        "Packers": {
            ROLE_HEAD_COACH: "Matt LaFleur",
            ROLE_OFFENSIVE_COORDINATOR: "Adam Stenavich",
            ROLE_DEFENSIVE_COORDINATOR: "Joe Barry",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Rich Bisaccia",
        },
        "Texans": {
            ROLE_HEAD_COACH: "Lovie Smith",
            ROLE_OFFENSIVE_COORDINATOR: "Pep Hamilton",
            ROLE_DEFENSIVE_COORDINATOR: "Lovie Smith",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Frank Ross",
        },
        "Colts": {
            ROLE_HEAD_COACH: "Frank Reich",
            ROLE_OFFENSIVE_COORDINATOR: "Marcus Brady",
            ROLE_DEFENSIVE_COORDINATOR: "Gus Bradley",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Bubba Ventrone",
        },
        "Jaguars": {
            ROLE_HEAD_COACH: "Doug Pederson",
            ROLE_OFFENSIVE_COORDINATOR: "Press Taylor",
            ROLE_DEFENSIVE_COORDINATOR: "Mike Caldwell",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Heath Farwell",
        },
        "Chiefs": {
            ROLE_HEAD_COACH: "Andy Reid",
            ROLE_OFFENSIVE_COORDINATOR: "Eric Bieniemy",
            ROLE_DEFENSIVE_COORDINATOR: "Steve Spagnuolo",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Dave Toub",
        },
        "Raiders": {
            ROLE_HEAD_COACH: "Josh McDaniels",
            ROLE_OFFENSIVE_COORDINATOR: "Mick Lombardi",
            ROLE_DEFENSIVE_COORDINATOR: "Patrick Graham",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Tom McMahon",
        },
        "Chargers": {
            ROLE_HEAD_COACH: "Brandon Staley",
            ROLE_OFFENSIVE_COORDINATOR: "Joe Lombardi",
            ROLE_DEFENSIVE_COORDINATOR: "Renaldo Hill",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Ryan Ficken",
        },
        "Rams": {
            ROLE_HEAD_COACH: "Sean McVay",
            ROLE_OFFENSIVE_COORDINATOR: "Liam Coen",
            ROLE_DEFENSIVE_COORDINATOR: "Raheem Morris",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Joe DeCamillis",
        },
        "Dolphins": {
            ROLE_HEAD_COACH: "Mike McDaniel",
            ROLE_OFFENSIVE_COORDINATOR: "Frank Smith",
            ROLE_DEFENSIVE_COORDINATOR: "Josh Boyer",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Danny Crossman",
        },
        "Vikings": {
            ROLE_HEAD_COACH: "Kevin O'Connell",
            ROLE_OFFENSIVE_COORDINATOR: "Wes Phillips",
            ROLE_DEFENSIVE_COORDINATOR: "Ed Donatell",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Matt Daniels",
        },
        "Patriots": {
            ROLE_HEAD_COACH: "Bill Belichick",
            ROLE_OFFENSIVE_COORDINATOR: "Matt Patricia",
            ROLE_DEFENSIVE_COORDINATOR: "Steve Belichick",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Cameron Achord",
        },
        "Saints": {
            ROLE_HEAD_COACH: "Dennis Allen",
            ROLE_OFFENSIVE_COORDINATOR: "Pete Carmichael",
            ROLE_DEFENSIVE_COORDINATOR: "Ryan Nielsen",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Darren Rizzi",
        },
        "Giants": {
            ROLE_HEAD_COACH: "Brian Daboll",
            ROLE_OFFENSIVE_COORDINATOR: "Mike Kafka",
            ROLE_DEFENSIVE_COORDINATOR: "Don Martindale",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Thomas McGaughey",
        },
        "Jets": {
            ROLE_HEAD_COACH: "Robert Saleh",
            ROLE_OFFENSIVE_COORDINATOR: "Mike LaFleur",
            ROLE_DEFENSIVE_COORDINATOR: "Jeff Ulbrich",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brant Boyer",
        },
        "Eagles": {
            ROLE_HEAD_COACH: "Nick Sirianni",
            ROLE_OFFENSIVE_COORDINATOR: "Shane Steichen",
            ROLE_DEFENSIVE_COORDINATOR: "Jonathan Gannon",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Michael Clay",
        },
        "Steelers": {
            ROLE_HEAD_COACH: "Mike Tomlin",
            ROLE_OFFENSIVE_COORDINATOR: "Matt Canada",
            ROLE_DEFENSIVE_COORDINATOR: "Teryl Austin",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Danny Smith",
        },
        "49ers": {
            ROLE_HEAD_COACH: "Kyle Shanahan",
            ROLE_OFFENSIVE_COORDINATOR: "Kyle Shanahan",
            ROLE_DEFENSIVE_COORDINATOR: "DeMeco Ryans",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brian Schneider",
        },
        "Seahawks": {
            ROLE_HEAD_COACH: "Pete Carroll",
            ROLE_OFFENSIVE_COORDINATOR: "Shane Waldron",
            ROLE_DEFENSIVE_COORDINATOR: "Clint Hurtt",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Larry Izzo",
        },
        "Buccaneers": {
            ROLE_HEAD_COACH: "Todd Bowles",
            ROLE_OFFENSIVE_COORDINATOR: "Byron Leftwich",
            ROLE_DEFENSIVE_COORDINATOR: "Kacy Rodgers",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Keith Armstrong",
        },
        "Titans": {
            ROLE_HEAD_COACH: "Mike Vrabel",
            ROLE_OFFENSIVE_COORDINATOR: "Todd Downing",
            ROLE_DEFENSIVE_COORDINATOR: "Shane Bowen",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Craig Aukerman",
        },
        "Commanders": {
            ROLE_HEAD_COACH: "Ron Rivera",
            ROLE_OFFENSIVE_COORDINATOR: "Scott Turner",
            ROLE_DEFENSIVE_COORDINATOR: "Jack Del Rio",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Nate Kaczor",
        },
    },
    2023: {
        "Cardinals": {
            ROLE_HEAD_COACH: "Jonathan Gannon",
            ROLE_OFFENSIVE_COORDINATOR: "Drew Petzing",
            ROLE_DEFENSIVE_COORDINATOR: "Nick Rallis",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Jeff Rodgers",
        },
        "Falcons": {
            ROLE_HEAD_COACH: "Arthur Smith",
            ROLE_OFFENSIVE_COORDINATOR: "Dave Ragone",
            ROLE_DEFENSIVE_COORDINATOR: "Ryan Nielsen",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Marquice Williams",
        },
        "Ravens": {
            ROLE_HEAD_COACH: "John Harbaugh",
            ROLE_OFFENSIVE_COORDINATOR: "Todd Monken",
            ROLE_DEFENSIVE_COORDINATOR: "Mike Macdonald",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Chris Horton",
        },
        "Bills": {
            ROLE_HEAD_COACH: "Sean McDermott",
            ROLE_OFFENSIVE_COORDINATOR: "Ken Dorsey",
            ROLE_DEFENSIVE_COORDINATOR: "Sean McDermott",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Matthew Smiley",
        },
        "Panthers": {
            ROLE_HEAD_COACH: "Frank Reich",
            ROLE_OFFENSIVE_COORDINATOR: "Thomas Brown",
            ROLE_DEFENSIVE_COORDINATOR: "Ejiro Evero",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Chris Tabor",
        },
        "Bears": {
            ROLE_HEAD_COACH: "Matt Eberflus",
            ROLE_OFFENSIVE_COORDINATOR: "Luke Getsy",
            ROLE_DEFENSIVE_COORDINATOR: "Alan Williams",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Richard Hightower",
        },
        "Bengals": {
            ROLE_HEAD_COACH: "Zac Taylor",
            ROLE_OFFENSIVE_COORDINATOR: "Brian Callahan",
            ROLE_DEFENSIVE_COORDINATOR: "Lou Anarumo",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Darrin Simmons",
        },
        "Browns": {
            ROLE_HEAD_COACH: "Kevin Stefanski",
            ROLE_OFFENSIVE_COORDINATOR: "Alex Van Pelt",
            ROLE_DEFENSIVE_COORDINATOR: "Jim Schwartz",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Bubba Ventrone",
        },
        "Cowboys": {
            ROLE_HEAD_COACH: "Mike McCarthy",
            ROLE_OFFENSIVE_COORDINATOR: "Brian Schottenheimer",
            ROLE_DEFENSIVE_COORDINATOR: "Dan Quinn",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "John Fassel",
        },
        "Broncos": {
            ROLE_HEAD_COACH: "Sean Payton",
            ROLE_OFFENSIVE_COORDINATOR: "Joe Lombardi",
            ROLE_DEFENSIVE_COORDINATOR: "Vance Joseph",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Ben Kotwica",
        },
        "Lions": {
            ROLE_HEAD_COACH: "Dan Campbell",
            ROLE_OFFENSIVE_COORDINATOR: "Ben Johnson",
            ROLE_DEFENSIVE_COORDINATOR: "Aaron Glenn",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Dave Fipp",
        },
        "Packers": {
            ROLE_HEAD_COACH: "Matt LaFleur",
            ROLE_OFFENSIVE_COORDINATOR: "Adam Stenavich",
            ROLE_DEFENSIVE_COORDINATOR: "Joe Barry",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Rich Bisaccia",
        },
        "Texans": {
            ROLE_HEAD_COACH: "DeMeco Ryans",
            ROLE_OFFENSIVE_COORDINATOR: "Bobby Slowik",
            ROLE_DEFENSIVE_COORDINATOR: "Matt Burke",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Frank Ross",
        },
        "Colts": {
            ROLE_HEAD_COACH: "Shane Steichen",
            ROLE_OFFENSIVE_COORDINATOR: "Jim Bob Cooter",
            ROLE_DEFENSIVE_COORDINATOR: "Gus Bradley",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brian Mason",
        },
        "Jaguars": {
            ROLE_HEAD_COACH: "Doug Pederson",
            ROLE_OFFENSIVE_COORDINATOR: "Press Taylor",
            ROLE_DEFENSIVE_COORDINATOR: "Mike Caldwell",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Heath Farwell",
        },
        "Chiefs": {
            ROLE_HEAD_COACH: "Andy Reid",
            ROLE_OFFENSIVE_COORDINATOR: "Matt Nagy",
            ROLE_DEFENSIVE_COORDINATOR: "Steve Spagnuolo",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Dave Toub",
        },
        "Raiders": {
            ROLE_HEAD_COACH: "Josh McDaniels",
            ROLE_OFFENSIVE_COORDINATOR: "Mick Lombardi",
            ROLE_DEFENSIVE_COORDINATOR: "Patrick Graham",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Tom McMahon",
        },
        "Chargers": {
            ROLE_HEAD_COACH: "Brandon Staley",
            ROLE_OFFENSIVE_COORDINATOR: "Kellen Moore",
            ROLE_DEFENSIVE_COORDINATOR: "Derrick Ansley",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Ryan Ficken",
        },
        "Rams": {
            ROLE_HEAD_COACH: "Sean McVay",
            ROLE_OFFENSIVE_COORDINATOR: "Mike LaFleur",
            ROLE_DEFENSIVE_COORDINATOR: "Raheem Morris",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Chase Blackburn",
        },
        "Dolphins": {
            ROLE_HEAD_COACH: "Mike McDaniel",
            ROLE_OFFENSIVE_COORDINATOR: "Frank Smith",
            ROLE_DEFENSIVE_COORDINATOR: "Vic Fangio",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Danny Crossman",
        },
        "Vikings": {
            ROLE_HEAD_COACH: "Kevin O'Connell",
            ROLE_OFFENSIVE_COORDINATOR: "Wes Phillips",
            ROLE_DEFENSIVE_COORDINATOR: "Brian Flores",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Matt Daniels",
        },
        "Patriots": {
            ROLE_HEAD_COACH: "Bill Belichick",
            ROLE_OFFENSIVE_COORDINATOR: "Bill O'Brien",
            ROLE_DEFENSIVE_COORDINATOR: "Steve Belichick",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Cameron Achord",
        },
        "Saints": {
            ROLE_HEAD_COACH: "Dennis Allen",
            ROLE_OFFENSIVE_COORDINATOR: "Pete Carmichael",
            ROLE_DEFENSIVE_COORDINATOR: "Joe Woods",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Darren Rizzi",
        },
        "Giants": {
            ROLE_HEAD_COACH: "Brian Daboll",
            ROLE_OFFENSIVE_COORDINATOR: "Mike Kafka",
            ROLE_DEFENSIVE_COORDINATOR: "Don Martindale",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Thomas McGaughey",
        },
        "Jets": {
            ROLE_HEAD_COACH: "Robert Saleh",
            ROLE_OFFENSIVE_COORDINATOR: "Nathaniel Hackett",
            ROLE_DEFENSIVE_COORDINATOR: "Jeff Ulbrich",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brant Boyer",
        },
        "Eagles": {
            ROLE_HEAD_COACH: "Nick Sirianni",
            ROLE_OFFENSIVE_COORDINATOR: "Brian Johnson",
            ROLE_DEFENSIVE_COORDINATOR: "Sean Desai",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Michael Clay",
        },
        "Steelers": {
            ROLE_HEAD_COACH: "Mike Tomlin",
            ROLE_OFFENSIVE_COORDINATOR: "Matt Canada",
            ROLE_DEFENSIVE_COORDINATOR: "Teryl Austin",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Danny Smith",
        },
        "49ers": {
            ROLE_HEAD_COACH: "Kyle Shanahan",
            ROLE_OFFENSIVE_COORDINATOR: "Kyle Shanahan",
            ROLE_DEFENSIVE_COORDINATOR: "Steve Wilks",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brian Schneider",
        },
        "Seahawks": {
            ROLE_HEAD_COACH: "Pete Carroll",
            ROLE_OFFENSIVE_COORDINATOR: "Shane Waldron",
            ROLE_DEFENSIVE_COORDINATOR: "Clint Hurtt",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Larry Izzo",
        },
        "Buccaneers": {
            ROLE_HEAD_COACH: "Todd Bowles",
            ROLE_OFFENSIVE_COORDINATOR: "Dave Canales",
            ROLE_DEFENSIVE_COORDINATOR: "Kacy Rodgers",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Keith Armstrong",
        },
        "Titans": {
            ROLE_HEAD_COACH: "Mike Vrabel",
            ROLE_OFFENSIVE_COORDINATOR: "Tim Kelly",
            ROLE_DEFENSIVE_COORDINATOR: "Shane Bowen",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Craig Aukerman",
        },
        "Commanders": {
            ROLE_HEAD_COACH: "Ron Rivera",
            ROLE_OFFENSIVE_COORDINATOR: "Eric Bieniemy",
            ROLE_DEFENSIVE_COORDINATOR: "Jack Del Rio",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Nate Kaczor",
        },
    },
    2024: {
        "Cardinals": {
            ROLE_HEAD_COACH: "Jonathan Gannon",
            ROLE_OFFENSIVE_COORDINATOR: "Drew Petzing",
            ROLE_DEFENSIVE_COORDINATOR: "Nick Rallis",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Jeff Rodgers",
        },
        "Falcons": {
            ROLE_HEAD_COACH: "Raheem Morris",
            ROLE_OFFENSIVE_COORDINATOR: "Zac Robinson",
            ROLE_DEFENSIVE_COORDINATOR: "Jimmy Lake",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Marquice Williams",
        },
        "Ravens": {
            ROLE_HEAD_COACH: "John Harbaugh",
            ROLE_OFFENSIVE_COORDINATOR: "Todd Monken",
            ROLE_DEFENSIVE_COORDINATOR: "Zach Orr",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Chris Horton",
        },
        "Bills": {
            ROLE_HEAD_COACH: "Sean McDermott",
            ROLE_OFFENSIVE_COORDINATOR: "Joe Brady",
            ROLE_DEFENSIVE_COORDINATOR: "Bobby Babich",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Matthew Smiley",
        },
        "Panthers": {
            ROLE_HEAD_COACH: "Dave Canales",
            ROLE_OFFENSIVE_COORDINATOR: "Brad Idzik",
            ROLE_DEFENSIVE_COORDINATOR: "Ejiro Evero",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Tracy Smith",
        },
        "Bears": {
            ROLE_HEAD_COACH: "Matt Eberflus",
            ROLE_OFFENSIVE_COORDINATOR: "Shane Waldron",
            ROLE_DEFENSIVE_COORDINATOR: "Eric Washington",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Richard Hightower",
        },
        "Bengals": {
            ROLE_HEAD_COACH: "Zac Taylor",
            ROLE_OFFENSIVE_COORDINATOR: "Dan Pitcher",
            ROLE_DEFENSIVE_COORDINATOR: "Lou Anarumo",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Darrin Simmons",
        },
        "Browns": {
            ROLE_HEAD_COACH: "Kevin Stefanski",
            ROLE_OFFENSIVE_COORDINATOR: "Ken Dorsey",
            ROLE_DEFENSIVE_COORDINATOR: "Jim Schwartz",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Bubba Ventrone",
        },
        "Cowboys": {
            ROLE_HEAD_COACH: "Mike McCarthy",
            ROLE_OFFENSIVE_COORDINATOR: "Brian Schottenheimer",
            ROLE_DEFENSIVE_COORDINATOR: "Mike Zimmer",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "John Fassel",
        },
        "Broncos": {
            ROLE_HEAD_COACH: "Sean Payton",
            ROLE_OFFENSIVE_COORDINATOR: "Joe Lombardi",
            ROLE_DEFENSIVE_COORDINATOR: "Vance Joseph",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Ben Kotwica",
        },
        "Lions": {
            ROLE_HEAD_COACH: "Dan Campbell",
            ROLE_OFFENSIVE_COORDINATOR: "Ben Johnson",
            ROLE_DEFENSIVE_COORDINATOR: "Aaron Glenn",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Dave Fipp",
        },
        "Packers": {
            ROLE_HEAD_COACH: "Matt LaFleur",
            ROLE_OFFENSIVE_COORDINATOR: "Adam Stenavich",
            ROLE_DEFENSIVE_COORDINATOR: "Jeff Hafley",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Rich Bisaccia",
        },
        "Texans": {
            ROLE_HEAD_COACH: "DeMeco Ryans",
            ROLE_OFFENSIVE_COORDINATOR: "Bobby Slowik",
            ROLE_DEFENSIVE_COORDINATOR: "Matt Burke",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Frank Ross",
        },
        "Colts": {
            ROLE_HEAD_COACH: "Shane Steichen",
            ROLE_OFFENSIVE_COORDINATOR: "Jim Bob Cooter",
            ROLE_DEFENSIVE_COORDINATOR: "Gus Bradley",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brian Mason",
        },
        "Jaguars": {
            ROLE_HEAD_COACH: "Doug Pederson",
            ROLE_OFFENSIVE_COORDINATOR: "Press Taylor",
            ROLE_DEFENSIVE_COORDINATOR: "Ryan Nielsen",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Heath Farwell",
        },
        "Chiefs": {
            ROLE_HEAD_COACH: "Andy Reid",
            ROLE_OFFENSIVE_COORDINATOR: "Matt Nagy",
            ROLE_DEFENSIVE_COORDINATOR: "Steve Spagnuolo",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Dave Toub",
        },
        "Raiders": {
            ROLE_HEAD_COACH: "Antonio Pierce",
            ROLE_OFFENSIVE_COORDINATOR: "Luke Getsy",
            ROLE_DEFENSIVE_COORDINATOR: "Patrick Graham",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Tom McMahon",
        },
        "Chargers": {
            ROLE_HEAD_COACH: "Jim Harbaugh",
            ROLE_OFFENSIVE_COORDINATOR: "Greg Roman",
            ROLE_DEFENSIVE_COORDINATOR: "Jesse Minter",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Ryan Ficken",
        },
        "Rams": {
            ROLE_HEAD_COACH: "Sean McVay",
            ROLE_OFFENSIVE_COORDINATOR: "Mike LaFleur",
            ROLE_DEFENSIVE_COORDINATOR: "Chris Shula",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Chase Blackburn",
        },
        "Dolphins": {
            ROLE_HEAD_COACH: "Mike McDaniel",
            ROLE_OFFENSIVE_COORDINATOR: "Frank Smith",
            ROLE_DEFENSIVE_COORDINATOR: "Anthony Weaver",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Danny Crossman",
        },
        "Vikings": {
            ROLE_HEAD_COACH: "Kevin O'Connell",
            ROLE_OFFENSIVE_COORDINATOR: "Wes Phillips",
            ROLE_DEFENSIVE_COORDINATOR: "Brian Flores",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Matt Daniels",
        },
        "Patriots": {
            ROLE_HEAD_COACH: "Jerod Mayo",
            ROLE_OFFENSIVE_COORDINATOR: "Alex Van Pelt",
            ROLE_DEFENSIVE_COORDINATOR: "DeMarcus Covington",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Jeremy Springer",
        },
        "Saints": {
            ROLE_HEAD_COACH: "Dennis Allen",
            ROLE_OFFENSIVE_COORDINATOR: "Klint Kubiak",
            ROLE_DEFENSIVE_COORDINATOR: "Joe Woods",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Darren Rizzi",
        },
        "Giants": {
            ROLE_HEAD_COACH: "Brian Daboll",
            ROLE_OFFENSIVE_COORDINATOR: "Mike Kafka",
            ROLE_DEFENSIVE_COORDINATOR: "Shane Bowen",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Michael Ghobrial",
        },
        "Jets": {
            ROLE_HEAD_COACH: "Robert Saleh",
            ROLE_OFFENSIVE_COORDINATOR: "Nathaniel Hackett",
            ROLE_DEFENSIVE_COORDINATOR: "Jeff Ulbrich",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brant Boyer",
        },
        "Eagles": {
            ROLE_HEAD_COACH: "Nick Sirianni",
            ROLE_OFFENSIVE_COORDINATOR: "Kellen Moore",
            ROLE_DEFENSIVE_COORDINATOR: "Vic Fangio",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Michael Clay",
        },
        "Steelers": {
            ROLE_HEAD_COACH: "Mike Tomlin",
            ROLE_OFFENSIVE_COORDINATOR: "Arthur Smith",
            ROLE_DEFENSIVE_COORDINATOR: "Teryl Austin",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Danny Smith",
        },
        "49ers": {
            ROLE_HEAD_COACH: "Kyle Shanahan",
            ROLE_OFFENSIVE_COORDINATOR: "Kyle Shanahan",
            ROLE_DEFENSIVE_COORDINATOR: "Nick Sorensen",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Brian Schneider",
        },
        "Seahawks": {
            ROLE_HEAD_COACH: "Mike Macdonald",
            ROLE_OFFENSIVE_COORDINATOR: "Ryan Grubb",
            ROLE_DEFENSIVE_COORDINATOR: "Aden Durde",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Jay Harbaugh",
        },
        "Buccaneers": {
            ROLE_HEAD_COACH: "Todd Bowles",
            ROLE_OFFENSIVE_COORDINATOR: "Liam Coen",
            ROLE_DEFENSIVE_COORDINATOR: "Kacy Rodgers",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Thomas McGaughey",
        },
        "Titans": {
            ROLE_HEAD_COACH: "Brian Callahan",
            ROLE_OFFENSIVE_COORDINATOR: "Nick Holz",
            ROLE_DEFENSIVE_COORDINATOR: "Dennard Wilson",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Colt Anderson",
        },
        "Commanders": {
            ROLE_HEAD_COACH: "Dan Quinn",
            ROLE_OFFENSIVE_COORDINATOR: "Kliff Kingsbury",
            ROLE_DEFENSIVE_COORDINATOR: "Joe Whitt Jr.",
            ROLE_SPECIAL_TEAMS_COORDINATOR: "Larry Izzo",
        },
    },
}


def split_full_name(full_name):
    """
    Split a coach name into first_name and last_name for the Coach model.

    Examples:
    - "Matt LaFleur" -> ("Matt", "LaFleur")
    - "Jim Bob Cooter" -> ("Jim Bob", "Cooter")
    - "Joe Whitt Jr." -> ("Joe", "Whitt Jr.")
    """
    suffixes = {"Jr.", "Sr.", "II", "III", "IV"}
    parts = full_name.strip().split()

    if len(parts) < 2:
        raise ValueError(f"Coach name must include first and last name: {full_name}")

    if len(parts) >= 3 and parts[-1] in suffixes:
        first_name = " ".join(parts[:-2])
        last_name = f"{parts[-2]} {parts[-1]}"
    else:
        first_name = " ".join(parts[:-1])
        last_name = parts[-1]

    return first_name, last_name


class Command(BaseCommand):
    help = "Seed NFL coaches and coach season assignments for 2022, 2023, and 2024."

    def add_arguments(self, parser):
        parser.add_argument(
            "--year",
            type=int,
            choices=[2022, 2023, 2024],
            help="Optional: seed only one year. If omitted, seeds 2022, 2023, and 2024.",
        )

    def handle(self, *args, **options):
        selected_year = options.get("year")
        years_to_seed = [selected_year] if selected_year else [2022, 2023, 2024]

        created_count = 0
        updated_count = 0
        skipped_count = 0

        expected_rows = len(years_to_seed) * 32 * 4

        with transaction.atomic():
            for year in years_to_seed:
                teams = COACHING_STAFFS[year]

                for team_name, roles in teams.items():
                    team_season = (
                        TeamSeason.objects.select_related("team", "season")
                        .filter(
                            team__team_name__iexact=team_name,
                            season__year=year,
                        )
                        .first()
                    )

                    if team_season is None:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Skipped {year} {team_name}: matching TeamSeason does not exist."
                            )
                        )
                        skipped_count += len(roles)
                        continue

                    for role, full_name in roles.items():
                        first_name, last_name = split_full_name(full_name)

                        coach = (
                            Coach.objects.filter(
                                first_name__iexact=first_name,
                                last_name__iexact=last_name,
                            )
                            .first()
                        )

                        if coach is None:
                            coach = Coach.objects.create(
                                first_name=first_name,
                                last_name=last_name,
                                role=role,
                                team=team_season.team,
                            )

                        _, created = CoachSeasonAssignment.objects.update_or_create(
                            coach=coach,
                            team_season=team_season,
                            role=role,
                            defaults={
                                "is_active": True,
                                "start_date": None,
                                "end_date": None,
                            },
                        )

                        # Keep legacy Coach fields useful for simple admin display.
                        # Historical truth still belongs to CoachSeasonAssignment.
                        if year == 2024:
                            coach.role = role
                            coach.team = team_season.team
                            coach.save(update_fields=["role", "team"])

                        if created:
                            created_count += 1
                        else:
                            updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Coach seed complete. "
                f"Expected rows: {expected_rows}. "
                f"Created: {created_count}. "
                f"Updated/existing: {updated_count}. "
                f"Skipped: {skipped_count}."
            )
        )

        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    "Some rows were skipped because TeamSeason records were missing. "
                    "Run your team/season seed command first, then run this command again."
                )
            )
