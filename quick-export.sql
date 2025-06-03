-- Quick Export Script for Database Migration
-- Run this in your PostgreSQL client to get all critical data

-- 1. Users table
\copy (SELECT * FROM users ORDER BY id) TO 'users_export.csv' CSV HEADER;

-- 2. Characters table  
\copy (SELECT * FROM characters ORDER BY id) TO 'characters_export.csv' CSV HEADER;

-- 3. Chat structure
\copy (SELECT * FROM chat_categories ORDER BY id) TO 'chat_categories_export.csv' CSV HEADER;
\copy (SELECT * FROM chat_rooms ORDER BY id) TO 'chat_rooms_export.csv' CSV HEADER;

-- 4. Messages (recent only - last 1000)
\copy (SELECT * FROM messages ORDER BY created_at DESC LIMIT 1000) TO 'messages_export.csv' CSV HEADER;

-- 5. Wand components (critical game data)
\copy (SELECT * FROM wand_woods ORDER BY id) TO 'wand_woods_export.csv' CSV HEADER;
\copy (SELECT * FROM wand_cores ORDER BY id) TO 'wand_cores_export.csv' CSV HEADER;
\copy (SELECT * FROM wand_lengths ORDER BY id) TO 'wand_lengths_export.csv' CSV HEADER;
\copy (SELECT * FROM wand_flexibilities ORDER BY id) TO 'wand_flexibilities_export.csv' CSV HEADER;

-- 6. User wands
\copy (SELECT * FROM wands ORDER BY id) TO 'wands_export.csv' CSV HEADER;

-- 7. Character data
\copy (SELECT * FROM character_inventory ORDER BY id) TO 'character_inventory_export.csv' CSV HEADER;
\copy (SELECT * FROM character_journal ORDER BY id) TO 'character_journal_export.csv' CSV HEADER;

-- 8. Requests
\copy (SELECT * FROM character_requests ORDER BY id) TO 'character_requests_export.csv' CSV HEADER;
\copy (SELECT * FROM housing_requests ORDER BY id) TO 'housing_requests_export.csv' CSV HEADER;

-- 9. Owl Post
\copy (SELECT * FROM owl_post_messages ORDER BY id) TO 'owl_post_export.csv' CSV HEADER;

-- 10. Game state
\copy (SELECT * FROM influence_bar) TO 'influence_bar_export.csv' CSV HEADER;
\copy (SELECT * FROM influence_history ORDER BY id) TO 'influence_history_export.csv' CSV HEADER;

-- Show summary
SELECT 'users' as table_name, count(*) as row_count FROM users
UNION ALL
SELECT 'characters', count(*) FROM characters
UNION ALL
SELECT 'chat_rooms', count(*) FROM chat_rooms
UNION ALL
SELECT 'messages', count(*) FROM messages
UNION ALL
SELECT 'wands', count(*) FROM wands
UNION ALL
SELECT 'wand_woods', count(*) FROM wand_woods
UNION ALL
SELECT 'wand_cores', count(*) FROM wand_cores
ORDER BY table_name;