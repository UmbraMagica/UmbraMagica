# Database Migration Guide

Tento guide vám pomůže přenést aplikaci z Neon databáze na jinou PostgreSQL službu.

## Podporované databázové služby

- **Supabase** (doporučeno)
- **Railway**
- **Render PostgreSQL**
- **AWS RDS**
- **Google Cloud SQL**
- **PlanetScale**
- **DigitalOcean Managed Databases**
- **Heroku Postgres**
- **Azure Database for PostgreSQL**

## Kroky migrace

### 1. Backup současných dat

```bash
# Export dat z Neon databáze
pg_dump $CURRENT_DATABASE_URL > backup.sql
```

### 2. Nastavení nové databáze

Vytvořte novou PostgreSQL databázi ve vámi zvolené službě a získejte connection string.

### 3. Úprava kódu

Nahraďte obsah `server/db.ts`:

```typescript
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Universal PostgreSQL connection
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export const db = drizzle(pool, { schema });
```

### 4. Aktualizace dependencies

```bash
npm uninstall @neondatabase/serverless
npm install pg @types/pg drizzle-orm
```

### 5. Nastavení environment variables

Nastavte nový `DATABASE_URL` pro vaši novou databázi.

### 6. Import dat

```bash
# Import dat do nové databáze
psql $NEW_DATABASE_URL < backup.sql
```

### 7. Push schema

```bash
npm run db:push
```

## Specifické nastavení pro populární služby

### Supabase

1. Vytvořte projekt na supabase.com
2. Jděte do Settings > Database
3. Zkopírujte Connection string (Transaction mode)
4. Nastavte jako DATABASE_URL

### Railway

1. Vytvořte PostgreSQL službu
2. Zkopírujte DATABASE_URL z variables
3. SSL je automaticky nakonfigurováno

### Render

1. Vytvořte PostgreSQL database
2. Zkopírujte External Database URL
3. SSL je vyžadováno v produkci

## Verifikace migrace

Po migraci spusťte:

```bash
npm run dev
```

A zkontrolujte, že:
- Aplikace se spustí bez chyb
- Můžete se přihlásit
- Data jsou správně načtena
- Všechny funkce fungují

## Troubleshooting

### SSL chyby
Přidejte `?sslmode=require` na konec DATABASE_URL

### Connection timeout
Zvyšte timeout v Pool konfiguraci:
```typescript
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
});
```

### SSL certificate chyby
```typescript
ssl: { rejectUnauthorized: false }
```