import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL;

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

client.connect()
  .then(() => {
    console.log('✅ Připojení k databázi OK!');
    return client.query('SELECT NOW()');
  })
  .then(res => {
    console.log('Výsledek dotazu:', res.rows);
    return client.end();
  })
  .catch(err => {
    console.error('❌ Chyba při připojení:', err);
    process.exit(1);
  }); 