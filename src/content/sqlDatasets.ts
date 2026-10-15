/**
 * Sample databases for the SQL course (tracks/sql/datasets/<name>.sql). Exercises load one with `::dataset name`,
 * and lesson examples written as ```sql name run on a fresh copy of it (```sql empty: on an empty database).
 */
const files = import.meta.glob<string>('./tracks/sql/datasets/*.sql', { query: '?raw', import: 'default', eager: true });

export const DATASETS: Record<string, string> = { empty: '' };
for (const [path, text] of Object.entries(files)) DATASETS[path.replace(/^.*\/|\.sql$/g, '')] = text;
