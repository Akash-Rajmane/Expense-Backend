const client = require("../util/database");

/**
 * ExpensesUrl data-access layer for ClickHouse.
 * Uses MergeTree — insert-only table, no updates needed.
 */
const ExpensesUrl = {
  async create({ url, fileName, userId }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await client.insert({
      table: "expenses_urls",
      values: [
        {
          id,
          url,
          fileName,
          userId,
          createdAt: now,
          updatedAt: now,
        },
      ],
      format: "JSONEachRow",
    });
    return { id, url, fileName, userId, createdAt: now, updatedAt: now };
  },

  async findByUserId(userId, { attributes } = {}) {
    const cols =
      attributes && attributes.length > 0 ? attributes.join(", ") : "*";

    const result = await client.query({
      query: `SELECT ${cols} FROM expenses_urls WHERE userId = {userId:UUID} ORDER BY createdAt DESC`,
      query_params: { userId },
      format: "JSONEachRow",
    });
    return result.json();
  },
};

module.exports = ExpensesUrl;