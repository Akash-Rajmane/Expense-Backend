const { initializeSchema } = require("./schema");
const client = require("./database");

async function testConnection() {
  console.log(`Connecting to ClickHouse at: ${process.env.CLICKHOUSE_URL || "http://localhost:8123"}...`);
  try {
    // 1. Ensure database and tables exist
    await initializeSchema();

    // 2. Query ClickHouse version
    const result = await client.query({
      query: "SELECT version()",
      format: "JSONEachRow",
    });
    const rows = await result.json();
    console.log("Connected successfully to ClickHouse!");
    console.log("Server version:", rows[0]["version()"]);
    console.log("Database and tables verified!");
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err.message);
    process.exit(1);
  }
}

testConnection();
