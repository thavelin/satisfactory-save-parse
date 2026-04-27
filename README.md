# Satisfactory Save Parser

A full-stack tool for parsing [Satisfactory](https://www.satisfactorygame.com/) `.sav` files and visualizing your factory data — with optional push to Notion.

---

## Application Overview

### Architecture

```
satisfactory-save-parse/
├── backend/               # Python / FastAPI API server
│   ├── main.py            # API routes and in-memory result cache
│   ├── notion_push.py     # Notion integration
│   ├── requirements.txt
│   ├── .env.example
│   └── extractors/        # Data extraction modules
│       ├── stats.py       # Game-level overview stats
│       ├── production.py  # Building / machine production data
│       ├── inventory.py   # Player and container inventories
│       └── map_data.py    # Resource node positions
└── frontend/              # React + Vite + Tailwind UI
    └── src/
        ├── App.tsx                      # Root app, upload flow, tab routing
        ├── api/client.ts                # Backend API calls
        ├── types/index.ts               # Shared TypeScript types
        └── components/
            ├── NotionPanel.tsx          # Notion push form
            └── tabs/
                ├── StatsTab.tsx         # Overview tab
                ├── ProductionTab.tsx    # Production tab
                ├── InventoryTab.tsx     # Inventory tab
                └── MapTab.tsx          # Map data tab
```

### How It Works

1. **Upload** — Drop a `.sav` file into the browser UI. The frontend sends it to the backend via `POST /api/parse`.
2. **Parse** — The backend uses the [sat_sav_parse](https://github.com/GreyHak/sat_sav_parse) library to decode the binary save format, then runs it through four extractors.
3. **View** — Results are cached in memory and displayed across four tabs:
   - **Overview** — playtime, session name, build milestones, and key metrics
   - **Production** — all factory buildings with their input/output rates
   - **Inventory** — player and storage container item totals
   - **Map Data** — resource node locations and types
4. **Export** — Download the full parsed result as JSON, or push any combination of datasets to Notion databases/pages.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/parse` | Upload and parse a `.sav` file |
| `GET` | `/api/parse/{id}` | Retrieve a cached parse result |
| `POST` | `/api/notion/push` | Push a cached result to Notion |

---

## Startup Guide

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **git**

### 1. Clone the repo

```bash
git clone https://github.com/thavelin/satisfactory-save-parse.git
cd satisfactory-save-parse
```

### 2. Run the setup script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Clone the `sat_sav_parse` parser library into `backend/lib/`
- Create a Python virtual environment and install backend dependencies
- Install frontend npm packages

### 3. Configure environment (optional)

If you plan to use the Notion integration, copy the example env file and fill in your credentials. You can also enter them directly in the UI at runtime.

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
NOTION_TOKEN=secret_xxxxxxxxxxxxxxxxxxxx
NOTION_STATS_PAGE_ID=        # ID of a Notion page for the overview block
NOTION_PRODUCTION_DB_ID=     # ID of a Notion database for production data
NOTION_INVENTORY_DB_ID=      # ID of a Notion database for inventory data
NOTION_MAP_DB_ID=            # ID of a Notion database for map nodes
```

### 4. Start the servers

Open two terminals:

**Terminal 1 — Backend**
```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --reload-dir .
```
The API will be available at `http://localhost:8000`.

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
```
The UI will be available at `http://localhost:5173`.

### 5. Use the app

1. Open `http://localhost:5173` in your browser.
2. Drag and drop (or browse for) a Satisfactory `.sav` file.
   - Save files are typically at `%LOCALAPPDATA%\FactoryGame\Saved\SaveGames` on Windows.
3. Explore your factory data across the four tabs.
4. Use **Download JSON** to export the raw data, or expand the **Notion** panel to push to your workspace.

---

## Notion Setup

To push data to Notion you need:

- A Notion [integration token](https://www.notion.so/my-integrations) with read/write access to your workspace.
- The IDs of the target Notion pages or databases (found in the page URL after the last `/` and before `?`).

Each destination is optional — only configure the ones you want to use.
