# UWM-COMPSCI557-Final-Project Group 9

**CS557 – Introduction to Database Systems**

## Team Members + Roles

| Name       | Role                        |
| ---------- | --------------------------- |
| Matthew    | Backend                     |
| Brendan    | Database Layer              |
| Drew       | Database Layer              |
| Zach       | Frontend                     |
| William    | Database Layer              |

# GridTracker

## Overview

GridTracker is a web-based application designed to manage and analyze American football player statistics, with an initial focus on the Green Bay Packers. The system provides both administrative and user-level functionality for interacting with a relational database.

The application supports:

* Storage and retrieval of player statistics across seasons
* Dynamic roster management (active/inactive players)
* Extensible statistical categories without schema modification
* Role-based access control (Admin vs Standard User)

---

## Tech Stack

### Backend

* Django
* Django REST Framework (DRF)
* MySQL

### Frontend

* Next.js (React)
* TypeScript
* Tailwind CSS
* Axios

---

## Project Setup

This repository is structured as two separate applications:

- [Backend (Django)](backend/README.md)
- [Frontend (Next.js)](frontend/README.md)

Please refer to each README for detailed installation, setup, and environment instructions.

---

## Database Design

The database is normalized to **Third Normal Form (3NF)** to:

* Eliminate redundancy
* Maintain data integrity
* Support scalability

### Core Entities

* **Player** — Represents an NFL player including name, position, age, height, weight, headshot URL, active status, and current team.
* **Team** — Represents an NFL team/franchise including team name, city, state, conference, division, abbreviation, and team colors.
* **Season** — Represents an NFL season year.
* **TeamSeason** — Connects a team to a specific season and stores season-specific conference/division information.
* **PlayerSeasonRoster** — Represents a player’s roster membership for a specific team-season, including jersey number, roster status, and active status.
* **Coach** — Represents an NFL coach, including name and coaching role.
* **CoachSeasonAssignment** — Assigns a coach to a specific team-season with role, active status, start date, and end date.
* **StatType** — Defines a supported statistic, including key, name, category, unit, and description.
* **PositionStatType** — Defines which stat types apply to each player position.
* **PlayerSeasonStat** — Stores a stat value for a player roster entry and stat type.

### Key Design Decisions

* **Associative entity (PlayerSeasonStat)** enables flexible stat tracking
* **TeamRoster table** supports:

  * Active/inactive players
  * Historical rosters
  * Multi-season tracking
* **Surrogate keys + unique constraints** used for ORM compatibility

---

## Features

### Admin

* Full CRUD operations
* Manage players, teams, seasons, stats
* Upload roster/stat data via Excel/CSV
* Manage user accounts

### Standard User

* Search players and teams
* View player statistics by season
* Filter by team and season
* Compare player performance
* TBD

---

## Expected Project Structure
```bash
gridtracker/
│
├── backend/ # Django backend application
├── frontend/ # Next.js frontend application
├── database/ # SQL schema, seed data, queries
├── docs/ # Documentation and ERDs
├── docker/
├── .env.example # Environment variable template (TBD)
└── README.md # This file
```
