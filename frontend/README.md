## 3️⃣ Frontend README (`frontend/README.md`)

# GridTracker Frontend

This is the Next.js frontend for the GridTracker project. It consumes the Django REST API to display players, teams, and statistics.

---

## Tech Stack

* **Framework:** Next.js 14.x (React-based)  
* **Language:** TypeScript  
* **Styling:** Tailwind CSS  
* **HTTP Client:** Axios  
* **Environment Variables:** `.env.local`

---

## Key dependencies:
react
react-dom
next
axios
tailwindcss
typescript
---
## Setup & Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install 
# or
yarn install
```
3. Create a .env.local file in the frontend/ directory and paste following content inside the file:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

4. Start development server
```bash
npm run dev # Frontend will be available at: http://localhost:3000
```

---
```bash
## Project Structure
frontend/
├── next/
├── app/              # Next.js pages (Server & Client components)
├── node_modules/
├── src/
│   ├── components/   # React components (PlayerList, etc.)
│   ├── api/          # Axios API helpers
├── public/           # Static assets
├── package.json
├── tsconfig.json
├── next.config.ts
└── .env.local
```
---
