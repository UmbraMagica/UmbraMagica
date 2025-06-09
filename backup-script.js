


import { Pool } from 'pg';
import fs from 'fs';

async function createBackup() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    console.log('Usage: DATABASE_URL=your_connection_string node backup-script.js');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Connecting to database...');
    const client = await pool.connect();

    // Get all table names
    const tablesResult = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    let backupData = {
      metadata: {
        exportDate: new Date().toISOString(),
        databaseUrl: process.env.DATABASE_URL.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'),
        totalTables: tablesResult.rows.length
      },
      tables: {}
    };

    console.log(`Found ${tablesResult.rows.length} tables to export`);

    for (const row of tablesResult.rows) {
      const tableName = row.tablename;
      console.log(`Exporting table: ${tableName}`);

      try {
        const result = await client.query(`SELECT * FROM "${tableName}"`);
        backupData.tables[tableName] = {
          rowCount: result.rows.length,
          data: result.rows
        };
        console.log(`  → ${result.rows.length} rows exported`);
      } catch (error) {
        console.error(`  → Error exporting ${tableName}:`, error.message);
        backupData.tables[tableName] = {
          error: error.message,
          data: []
        };
      }
    }

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database-backup-${timestamp}.json`;

    // Write complete backup
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));

    // Create SQL dump for critical tables
    const criticalTables = [
      'users', 'characters', 'chat_rooms', 'chat_categories', 
      'messages', 'wand_woods', 'wand_cores', 'wand_lengths', 
      'wand_flexibilities', 'wands'
    ];

    let sqlDump = `-- Database backup created on ${new Date().toISOString()}\n`;
    sqlDump += `-- Critical tables export\n\n`;

    for (const tableName of criticalTables) {
      if (backupData.tables[tableName] && backupData.tables[tableName].data.length > 0) {
        sqlDump += `-- Table: ${tableName}\n`;
        const rows = backupData.tables[tableName].data;

        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          sqlDump += `DELETE FROM "${tableName}";\n`;

          for (const row of rows) {
            const values = columns.map(col => {
              const val = row[col];
              if (val === null || val === undefined) return 'NULL';
              if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
              if (typeof val === 'boolean') return val ? 'true' : 'false';
              if (val instanceof Date) return `'${val.toISOString()}'`;
              return val;
            }).join(', ');

            sqlDump += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values});\n`;
          }
          sqlDump += '\n';
        }
      }
    }

    const sqlFilename = `database-backup-${timestamp}.sql`;
    fs.writeFileSync(sqlFilename, sqlDump);

    console.log('\n=== BACKUP COMPLETED ===');
    console.log(`JSON backup: ${filename} (${Math.round(fs.statSync(filename).size / 1024)}KB)`);
    console.log(`SQL backup: ${sqlFilename} (${Math.round(fs.statSync(sqlFilename).size / 1024)}KB)`);

    // Summary
    const totalRows = Object.values(backupData.tables).reduce((sum, table) => sum + (table.rowCount || 0), 0);
    console.log(`Total rows exported: ${totalRows}`);

    console.log('\nTable summary:');
    Object.entries(backupData.tables).forEach(([name, table]) => {
      console.log(`  ${name}: ${table.rowCount || 0} rows`);
    });

    client.release();
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createBackup();