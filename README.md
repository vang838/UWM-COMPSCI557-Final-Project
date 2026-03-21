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
