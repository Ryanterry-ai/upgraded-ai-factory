const { Client } = require("pg");
async function test() {
  const client = new Client({
    connectionString: "postgresql://postgres:Upgradedhealth@1401@db.ctrcrcgfkwexkjwbwwvh.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();

  const cols = await client.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE column_name = 'embedding' ORDER BY table_name");
  console.log("Embedding columns:");
  for (const r of cols.rows) console.log("  " + r.table_name + "." + r.column_name + " (" + r.data_type + ")");

  const idxs = await client.query("SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE '%embedding%'");
  console.log("Embedding indexes:");
  for (const r of idxs.rows) console.log("  " + r.indexname + " on " + r.tablename);

  const rls = await client.query("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log("RLS status:");
  for (const r of rls.rows) console.log("  " + r.tablename + ": " + (r.rowsecurity ? "ENABLED" : "DISABLED"));

  const procs = await client.query("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'search_%'");
  console.log("Search functions:");
  for (const r of procs.rows) console.log("  " + r.routine_name + "()");

  await client.end();
}
test().catch(e => console.error(e.message));
