const client = require("./database");

const TABLE_SCHEMAS = [
  // Users table — ReplacingMergeTree with email bloom filter index
  `CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT generateUUIDv4(),
    name String,
    email String,
    password String,
    totalExpense Float64 DEFAULT 0,
    isPremiumUser UInt8 DEFAULT 0,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    version UInt64 DEFAULT 1,
    INDEX idx_users_email email TYPE bloom_filter() GRANULARITY 1
  ) ENGINE = ReplacingMergeTree(version)
  ORDER BY id`,

  // Expenses table — MergeTree with id bloom filter & category set index
  `CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT generateUUIDv4(),
    description String,
    amount Float64,
    category String,
    userId UUID,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    INDEX idx_expenses_id id TYPE bloom_filter() GRANULARITY 1,
    INDEX idx_expenses_category category TYPE set(10) GRANULARITY 1
  ) ENGINE = MergeTree()
  ORDER BY (userId, createdAt)`,

  // Orders table — ReplacingMergeTree with orderId & userId bloom filter indexes
  `CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT generateUUIDv4(),
    paymentId String DEFAULT '',
    orderId String,
    status String,
    userId UUID,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    version UInt64 DEFAULT 1,
    INDEX idx_orders_order_id orderId TYPE bloom_filter() GRANULARITY 1,
    INDEX idx_orders_user_id userId TYPE bloom_filter() GRANULARITY 1
  ) ENGINE = ReplacingMergeTree(version)
  ORDER BY id`,

  // Forgot password requests — ReplacingMergeTree with userId index
  `CREATE TABLE IF NOT EXISTS forgot_password_requests (
    id String,
    isActive UInt8 DEFAULT 1,
    userId UUID,
    createdAt DateTime64(3) DEFAULT now64(3),
    updatedAt DateTime64(3) DEFAULT now64(3),
    version UInt64 DEFAULT 1,
    INDEX idx_fpr_user_id userId TYPE bloom_filter() GRANULARITY 1
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

// ALTER statements to add indexes to existing tables if already created
const INDEX_MIGRATIONS = [
  `ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_email email TYPE bloom_filter() GRANULARITY 1`,
  `ALTER TABLE expenses ADD INDEX IF NOT EXISTS idx_expenses_id id TYPE bloom_filter() GRANULARITY 1`,
  `ALTER TABLE expenses ADD INDEX IF NOT EXISTS idx_expenses_category category TYPE set(10) GRANULARITY 1`,
  `ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_orders_order_id orderId TYPE bloom_filter() GRANULARITY 1`,
  `ALTER TABLE orders ADD INDEX IF NOT EXISTS idx_orders_user_id userId TYPE bloom_filter() GRANULARITY 1`,
  `ALTER TABLE forgot_password_requests ADD INDEX IF NOT EXISTS idx_fpr_user_id userId TYPE bloom_filter() GRANULARITY 1`,
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

  await adminClient.command({
    query: `CREATE DATABASE IF NOT EXISTS ${dbName}`,
  });
  await adminClient.close();

  // Create tables with indexes
  for (const schema of TABLE_SCHEMAS) {
    await client.command({ query: schema });
  }

  // Ensure indexes exist on pre-existing tables
  for (const migration of INDEX_MIGRATIONS) {
    try {
      await client.command({ query: migration });
    } catch (err) {
      // Ignore if index already exists
    }
  }

  console.log("ClickHouse schema and indexes initialized successfully");
}

module.exports = { initializeSchema };
