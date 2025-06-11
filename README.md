# Umbra Magica

Multiplayer text-based RPG platform with real-time chat functionality.

## Architecture

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: Node.js + Express + WebSockets (deployed on Fly.io)
- **Database**: Supabase PostgreSQL

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## Backend Setup

```bash
cd backend
npm install
npm run dev
```

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=your-backend-url
```

### Backend (.env)
```
DATABASE_URL=your-supabase-connection-string
PORT=8080
```

## Deployment

1. Frontend: Deploy to Vercel
2. Backend: Deploy to Fly.io
3. Database: Supabase PostgreSQL

# UmbraMagica Web App

This project uses a Node/Express backend and React/Vite frontend to fetch and display multiple tables from Supabase.

## Setup

1. Replace the Supabase URL and anon key in `server.js` with your own credentials.
2. Run `npm install` in the root directory to install backend dependencies.
3. Run `npm start` or `node server.js` to start the backend server.
4. Navigate to `frontend` folder, run `npm install` to install frontend dependencies.
5. Run `npm run dev` in `frontend` to start the React/Vite frontend.

## Usage

- The backend exposes `/api/tables` endpoint that fetches data from Supabase tables: `wands`, `wand_flexibilities`, `wand_lengths`, and `wand_cores`.
- The React frontend fetches this data and displays each table in a simple HTML table.