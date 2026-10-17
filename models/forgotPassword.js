const client = require("../util/database");

/**
 * ForgotPasswordRequest data-access layer for ClickHouse.
 * Uses ReplacingMergeTree — isActive toggle is done by re-inserting with a higher version.
 */
const ForgotPasswordRequest = {
  async create({ id, userId, isActive }) {
    const now = new Date().toISOString();
    await client.insert({
      table: "forgot_password_requests",
      values: [
        {
          id,
          userId,
          isActive: isActive ? 1 : 0,
          createdAt: now,
          updatedAt: now,
          version: 1,
        },
      ],
      format: "JSONEachRow",
    });
    return { id, userId, isActive, createdAt: now, updatedAt: now };
  },

  async findById(id) {
    const result = await client.query({
      query: `SELECT * FROM forgot_password_requests FINAL WHERE id = {id:String} LIMIT 1`,
      query_params: { id },
      format: "JSONEachRow",
    });
    const rows = await result.json();
    if (rows.length === 0) return null;
    // Convert UInt8 back to boolean
    rows[0].isActive = Boolean(Number(rows[0].isActive));
    return rows[0];
  },

  async update(id, updates) {
    const existing = await ForgotPasswordRequest.findById(id);
    if (!existing) throw new Error("ForgotPasswordRequest not found");

    const updatedRow = {
      ...existing,
      ...updates,
      isActive: ("isActive" in updates ? updates.isActive : existing.isActive) ? 1 : 0,
      updatedAt: new Date().toISOString(),
      version: Number(existing.version) + 1,
    };

    await client.insert({
      table: "forgot_password_requests",
      values: [updatedRow],
      format: "JSONEachRow",
    });

    return ForgotPasswordRequest.findById(id);
  },
};

module.exports = ForgotPasswordRequest;