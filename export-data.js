#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');

async function exportData() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
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
    
    let exportData = {};
    
    for (const row of tablesResult.rows) {
      const tableName = row.tablename;
      console.log(`Exporting table: ${tableName}`);
      
      const result = await client.query(`SELECT * FROM "${tableName}"`);
      exportData[tableName] = result.rows;
    }
    
    // Write to JSON file
    const filename = `data-export-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`Data exported to ${filename}`);
    console.log(`Total tables exported: ${Object.keys(exportData).length}`);
    
    client.release();
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

exportData();