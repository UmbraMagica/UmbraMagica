# Umbra Magica

Multiplayer text-based RPG platform with real-time chat functionality.

## Unified Deployment (Render)

1. Vše buildíš a nasazuješ z rootu projektu.
2. Build frontendu proběhne automaticky a jeho výstup se přesune do `server/public`.
3. Backend Express server v produkci servíruje statické soubory z této složky.
4. Pro Render nastav build command:
   ```sh
   npm install && npm run build
   ```
   a start command:
   ```sh
   npm start
   ```
5. Vše běží na jedné adrese (backend i frontend).

## Environment Variables

- `DATABASE_URL` – connection string na Supabase PostgreSQL
- `PORT` – port, na kterém poběží server (Render nastaví automaticky)

## Vývojové skripty a build

- `npm run dev` – spustí backend v development módu
- `npm run build` – buildne frontend, přesune statické soubory a buildne backend
- `npm start` – spustí backend v produkci

## Původní architektura

- **Frontend**: React + Vite (ve složce `client/`)
- **Backend**: Node.js + Express + WebSockets (ve složce `server/`)
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