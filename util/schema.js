const client = require("./database");

const TABLE_SCHEMAS = [
  // Users table — ReplacingMergeTree so we can "update" by re-inserting with a newer version
  `CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT generateUUIDv4(),
    name String,
    email String,
    password String,
    totalExpense Float64 DEFAULT 0,
    isPremiumUser UInt8 DEFAULT 0,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    version UInt64 DEFAULT 1
  ) ENGINE = ReplacingMergeTree(version)
  ORDER BY id`,

  // Expenses table — MergeTree (deletes handled via ALTER TABLE DELETE)
  `CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT generateUUIDv4(),
    description String,
    amount Float64,
    category String,
    userId UUID,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3)
  ) ENGINE = MergeTree()
  ORDER BY (userId, createdAt)`,

  // Orders table — ReplacingMergeTree for status updates
  `CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT generateUUIDv4(),
    paymentId String DEFAULT '',
    orderId String,
    status String,
    userId UUID,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    version UInt64 DEFAULT 1
  ) ENGINE = ReplacingMergeTree(version)
  ORDER BY id`,

  // Forgot password requests — ReplacingMergeTree for isActive updates
  `CREATE TABLE IF NOT EXISTS forgot_password_requests (
    id String,
    isActive UInt8 DEFAULT 1,
    userId UUID,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    version UInt64 DEFAULT 1
  ) ENGINE = ReplacingMergeTree(version)
  ORDER BY id`,

  // Expenses URLs — MergeTree (insert-only)
  `CREATE TABLE IF NOT EXISTS expenses_urls (
    id UUID DEFAULT generateUUIDv4(),
    url String,
    fileName String,
    userId UUID,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3)
  ) ENGINE = MergeTree()
  ORDER BY (userId, createdAt)`,
];

const { createClient } = require("@clickhouse/client");

async function initializeSchema() {
  const dbName = process.env.CLICKHOUSE_DATABASE || "expense_tracker";

  // Connect to 'default' database first to ensure target database exists
  const adminClient = createClient({
    url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
    username: process.env.CLICKHOUSE_USER || "default",
    password: process.env.CLICKHOUSE_PASSWORD || "",
    database: "default",
  });

  await adminClient.query({
    query: `CREATE DATABASE IF NOT EXISTS ${dbName}`,
  });
  await adminClient.close();

  for (const schema of TABLE_SCHEMAS) {
    await client.query({ query: schema });
  }
  console.log("ClickHouse schema initialized successfully");
}

module.exports = { initializeSchema };
