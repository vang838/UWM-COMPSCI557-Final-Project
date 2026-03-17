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

## Setup & Installation

### Prerequisites

Ensure the following are installed:

* Python **3.11**
* Node.js (v18+ recommended)
* MySQL Server
* Git

---

## Backend Setup (Django)

Navigate to the backend directory:

```bash
cd backend
```

### 1. Create Virtual Environment

```bash
py -3.11 -m venv venv
```

### 2. Activate Virtual Environment

**Windows (Command Prompt):**

```bash
venv\Scripts\activate
```

**Git Bash:**

```bash
source venv/Scripts/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Run Migrations

```bash
python manage.py migrate
```

---

### 5. Start Development Server

```bash
python manage.py runserver
```

Backend will be available at:

```
http://127.0.0.1:8000
```

---

## Frontend Setup (Next.js)

Navigate to the frontend directory:

```bash
cd frontend
```

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Frontend will be available at:

```
http://localhost:3000
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory based on `.env.example`:

Example:

```env
DB_NAME=gridtracker
DB_USER=root
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=3306
SECRET_KEY=your_secret_key
DEBUG=True
```

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
│   │
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── asgi.py
│   │
│   ├── apps/
│   │   ├── players/
│   │   ├── teams/
│   │   ├── stats/
│   │   ├── seasons/
│   │   └── users/
│   │
│   ├── common/
│   │   ├── permissions/
│   │   └── utils/
│   │
│   └── tests/
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── types/
│
├── database/
│   ├── schema.sql
│   ├── seed_data.sql
│   └── queries.sql
│
├── docs/
│   ├── ERD.png
│   ├── design.md
│   ├── api.md
│   └── architecture.md
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```
