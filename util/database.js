require("dotenv").config();

const { createClient } = require("@clickhouse/client");

const client = createClient({
  url: process.env.CLICKHOUSE_URL || "http://localhost:8123",
  username: process.env.CLICKHOUSE_USER || "default",
  password: process.env.CLICKHOUSE_PASSWORD || "",
  database: process.env.CLICKHOUSE_DATABASE || "default",
  request_timeout: 30000,
  max_open_connections: 50,
  keep_alive: {
    enabled: true,
    idle_socket_ttl: 60000,
  },
  compression: {
    response: true,
    request: true,
  },
});

module.exports = client;
