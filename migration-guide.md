# Ollivander System Migration Guide

## Critical Database Tables
```sql
-- Export these tables before migration:
-- wand_woods (38 records)
-- wand_cores (22 records) 
-- wand_lengths (10 records)
-- wand_flexibilities (11 records)
-- wands (user wands)
```

## Data Export Commands
```sql
-- Export component data
\copy wand_woods TO 'wand_woods_backup.csv' CSV HEADER;
\copy wand_cores TO 'wand_cores_backup.csv' CSV HEADER;
\copy wand_lengths TO 'wand_lengths_backup.csv' CSV HEADER;
\copy wand_flexibilities TO 'wand_flexibilities_backup.csv' CSV HEADER;
\copy wands TO 'wands_backup.csv' CSV HEADER;
```

## Required Environment Variables
- DATABASE_URL (PostgreSQL connection string)
- Session storage depends on PostgreSQL

## Schema Dependencies
- Uses Drizzle ORM with PostgreSQL adapter
- Specific column types: `serial`, `boolean`, `text`, `varchar`
- JSON backup available in: `wand_components_full.json`

## API Endpoints to Update
- `/api/wand-components` - component loading
- `/api/admin/wand-components` - admin management  
- `/api/characters/:id/wand` - character wands

## Migration Checklist
1. ✅ Export all wand-related tables
2. ✅ Backup `wand_components_full.json`
3. ⚠️ Update database connection in `server/db.ts`
4. ⚠️ Verify schema compatibility in `shared/schema.ts`
5. ⚠️ Test component loading and admin functions
6. ⚠️ Validate random wand generation logic