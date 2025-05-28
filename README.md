# RPG Realm - Textové RPG Chat Aplikace

Webová platforma pro dynamické textové RPG s real-time komunikací, systémem postav a pokročilými chatovými místnostmi.

## Funkce

- 🎭 **Systém postav** - Vytváření a správa herních postav
- 💬 **Real-time chat** - WebSocket komunikace pro okamžité zprávy
- 🏰 **Herní místnosti** - Hlavní chat a testovací prostory
- 👥 **Uživatelské role** - Admin a běžní uživatelé
- 🎨 **Moderní UI** - Tmavé téma s fantasy designem
- 🔐 **Bezpečnost** - Hashovaná hesla a session management

## Technologie

- **Frontend**: React, TypeScript, Tailwind CSS, Wouter
- **Backend**: Node.js, Express, WebSocket
- **Databáze**: PostgreSQL s Drizzle ORM
- **Real-time**: WebSocket komunikace

## Produkční nasazení

Aplikace je připravena pro nasazení na Railway.app:

1. Vytvořte nový projekt na Railway
2. Propojte s GitHub repository
3. Railway automaticky detekuje Node.js aplikaci
4. Databáze PostgreSQL se vytvoří automaticky

## Lokální vývoj

```bash
npm install
npm run dev
```

Aplikace běží na `http://localhost:5000`

## Databáze

Aplikace automaticky vytvoří potřebné tabulky při prvním spuštění.

## Licence

MIT License