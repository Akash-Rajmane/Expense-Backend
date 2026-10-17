const client = require("../util/database");

/**
 * Expense data-access layer for ClickHouse.
 * Uses MergeTree — deletes are handled via ALTER TABLE DELETE mutations.
 */
const Expense = {
  async create({ description, amount, category, userId }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await client.insert({
      table: "expenses",
      values: [
        {
          id,
          description,
          amount,
          category,
          userId,
          createdAt: now,
          updatedAt: now,
        },
      ],
      format: "JSONEachRow",
    });
    return { id, description, amount, category, userId, createdAt: now, updatedAt: now };
  },

  async findById(id) {
    const result = await client.query({
      query: `SELECT * FROM expenses WHERE id = {id:UUID}`,
      query_params: { id },
      format: "JSONEachRow",
    });
    const rows = await result.json();
    return rows.length > 0 ? rows[0] : null;
  },

  async findByUserId(userId, { limit, offset } = {}) {
    let query = `SELECT * FROM expenses WHERE userId = {userId:UUID} ORDER BY createdAt DESC`;
    if (limit !== undefined) {
      query += ` LIMIT {limit:UInt32}`;
    }
    if (offset !== undefined) {
      query += ` OFFSET {offset:UInt32}`;
    }

    const result = await client.query({
      query,
      query_params: { userId, limit, offset },
      format: "JSONEachRow",
    });
    return result.json();
  },

  async countByUserId(userId) {
    const result = await client.query({
      query: `SELECT count() as cnt FROM expenses WHERE userId = {userId:UUID}`,
      query_params: { userId },
      format: "JSONEachRow",
    });
    const rows = await result.json();
    return Number(rows[0].cnt);
  },

  async deleteById(id) {
    await client.command({
      query: `ALTER TABLE expenses DELETE WHERE id = {id:UUID}`,
      query_params: { id },
    });
  },

  async findAll({ where, order } = {}) {
    let conditions = [];
    const params = {};

    if (where) {
      if (where.userId) {
        conditions.push(`userId = {userId:UUID}`);
        params.userId = where.userId;
      }
      if (where.createdAt) {
        if (where.createdAt.between) {
          conditions.push(
            `createdAt >= {startDate:DateTime64(3)} AND createdAt <= {endDate:DateTime64(3)}`
          );
          params.startDate = where.createdAt.between[0].toISOString();
          params.endDate = where.createdAt.between[1].toISOString();
        }
      }
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    let orderClause = "";
    if (order && order.length > 0) {
      const orderParts = order.map(
        ([col, dir]) => `${col} ${dir || "ASC"}`
      );
      orderClause = `ORDER BY ${orderParts.join(", ")}`;
    }

    const result = await client.query({
      query: `SELECT * FROM expenses ${whereClause} ${orderClause}`,
      query_params: params,
      format: "JSONEachRow",
    });
    return result.json();
  },
};

module.exports = Expense;
