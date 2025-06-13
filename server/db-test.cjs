require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

client.connect()
  .then(() => {
    console.log('✅ Připojeno k databázi úspěšně.');
    return client.end();
  })
  .catch((err) => {
    console.error('❌ Chyba při připojování k databázi:', err);
    process.exit(1);
  }); 