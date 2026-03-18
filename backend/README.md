# GridTracker Backend

This is the Django backend for the GridTracker project. It provides a REST API to manage players, teams, seasons, statistics, and authentication.

---

## Tech Stack

* **Framework:** Django 4.x  
* **API:** Django REST Framework (DRF)  
* **Database:** MySQL  
* **Python:** 3.11  

---

## Required Dependencies

Install dependencies via `pip`:
Django>=4.2
djangorestframework
mysqlclient
python-dotenv

---

## Setup & Installation

1. Create a virtual environment in the backend directory:
```bash
py -3.11 -m venv venv
```

2. Activate the virtual environment:
## Windows CMD:
```bash
venv\Scripts\activate
```

## Git Bash / Unix:
```bash
source venv/Scripts/activate
```

3. Install the required dependencies:
```bash
pip install -r requirements.txt
```

4. Run migrations to set up the database schema:
```bash
python manage.py migrate
```
---
```bash
## Project Structure
backend/
├── manage.py
├── requirements.txt
├── config/           # Django settings, urls, asgi/wsgi
├── apps/             # Players, Teams, Stats, Seasons, Users
├── tests/            # Unit & integration tests
└── README.md
```
