import pg from "pg";

const adminUrl =
  process.env.RANKMYSEO_POSTGRES_ADMIN_URL ??
  "postgres://test:test@localhost:5432/postgres";

const databases = [
  "rankmyseo_drizzle",
  "rankmyseo_prisma",
  "rankmyseo_kysely",
];

const client = new pg.Client({ connectionString: adminUrl });
await client.connect();

try {
  for (const db of databases) {
    const { rows } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [db],
    );
    if (rows.length === 0) {
      await client.query(`CREATE DATABASE "${db}"`);
      console.log(`created database ${db}`);
    } else {
      console.log(`database ${db} already exists`);
    }
  }
} finally {
  await client.end();
}
