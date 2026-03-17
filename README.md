# UWM-COMPSCI557-Final-Project Group 9

## Team Members + Roles (Can be switched later)

| Name       | Role                        |
| ---------- | --------------------------- |
| Matthew    | Backend                     |
| Brendan    | Database Layer              |
| Drew       | Database Layer              |
| Zach       | Frontend                    |
| William    | Database Layer              |

# GridTracker

**CS557 – Introduction to Database Systems**

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

## Database Design

The database is normalized to **Third Normal Form (3NF)** to:

* Eliminate redundancy
* Maintain data integrity
* Support scalability

### Core Entities

* **Player**
* **Team**
* **Season**
* **StatType**
* **PlayerSeasonStat**
* **Coach**
* **TeamRoster**

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

---

## Expected Project Structure

```
gridtracker/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── apps/
│   │   ├── players/
│   │   ├── teams/
│   │   ├── stats/
│   │   ├── seasons/
│   │   └── users/
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│
├── database/
│   ├── schema.sql
│   └── seed_data.sql
│
├── docs/
│   ├── ERD.png
│   └── design.md
│
└── README.md
```
