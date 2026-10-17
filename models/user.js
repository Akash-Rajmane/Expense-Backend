const client = require("../util/database");

/**
 * User data-access layer for ClickHouse.
 * Uses ReplacingMergeTree — "updates" are done by re-inserting with a higher version.
 * SELECT ... FINAL ensures only the latest version of each row is returned.
 */
const User = {
  async create({ name, email, password }) {
    const id = crypto.randomUUID();
    await client.insert({
      table: "users",
      values: [
        {
          id,
          name,
          email,
          password,
          totalExpense: 0,
          isPremiumUser: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: 1,
        },
      ],
      format: "JSONEachRow",
    });
    return User.findById(id);
  },

  async findById(id) {
    const result = await client.query({
      query: `SELECT * FROM users FINAL WHERE id = {id:UUID}`,
      query_params: { id },
      format: "JSONEachRow",
    });
    const rows = await result.json();
    return rows.length > 0 ? rows[0] : null;
  },

  async findByEmail(email) {
    const result = await client.query({
      query: `SELECT * FROM users FINAL WHERE email = {email:String}`,
      query_params: { email },
      format: "JSONEachRow",
    });
    const rows = await result.json();
    return rows.length > 0 ? rows[0] : null;
  },

  async findAll({ attributes, order } = {}) {
    // Build column list
    const cols =
      attributes && attributes.length > 0 ? attributes.join(", ") : "*";

    // Build ORDER BY
    let orderClause = "";
    if (order && order.length > 0) {
      const orderParts = order.map(
        ([col, dir]) => `${col} ${dir || "ASC"}`
      );
      orderClause = `ORDER BY ${orderParts.join(", ")}`;
    }

    const result = await client.query({
      query: `SELECT ${cols} FROM users FINAL ${orderClause}`,
      format: "JSONEachRow",
    });
    return result.json();
  },

  /**
   * "Update" a user by re-inserting the full row with an incremented version.
   * The ReplacingMergeTree engine will keep only the latest version on merge.
   * Using FINAL in SELECT ensures we always read the latest.
   */
  async update(id, updates) {
    const existing = await User.findById(id);
    if (!existing) throw new Error("User not found");

    const updatedUser = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: Number(existing.version) + 1,
    };

    // Ensure boolean fields stay as UInt8
    if ("isPremiumUser" in updatedUser) {
      updatedUser.isPremiumUser = updatedUser.isPremiumUser ? 1 : 0;
    }

    await client.insert({
      table: "users",
      values: [updatedUser],
      format: "JSONEachRow",
    });

    return User.findById(id);
  },
};

module.exports = User;