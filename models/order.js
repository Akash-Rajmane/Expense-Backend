const client = require("../util/database");

/**
 * Order data-access layer for ClickHouse.
 * Uses ReplacingMergeTree — status updates are done by re-inserting with a higher version.
 */
const Order = {
  async create({ orderId, status, userId }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await client.insert({
      table: "orders",
      values: [
        {
          id,
          paymentId: "",
          orderId,
          status,
          userId,
          createdAt: now,
          updatedAt: now,
          version: 1,
        },
      ],
      format: "JSONEachRow",
    });
    return { id, orderId, status, userId, paymentId: "", createdAt: now, updatedAt: now };
  },

  async findByOrderId(orderId) {
    const result = await client.query({
      query: `SELECT * FROM orders FINAL WHERE orderId = {orderId:String} LIMIT 1`,
      query_params: { orderId },
      format: "JSONEachRow",
    });
    const rows = await result.json();
    return rows.length > 0 ? rows[0] : null;
  },

  async update(id, updates) {
    const existing = await Order.findById(id);
    if (!existing) throw new Error("Order not found");

    const updatedOrder = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: Number(existing.version) + 1,
    };

    await client.insert({
      table: "orders",
      values: [updatedOrder],
      format: "JSONEachRow",
    });

    return Order.findById(id);
  },

  async findById(id) {
    const result = await client.query({
      query: `SELECT * FROM orders FINAL WHERE id = {id:UUID} LIMIT 1`,
      query_params: { id },
      format: "JSONEachRow",
    });
    const rows = await result.json();
    return rows.length > 0 ? rows[0] : null;
  },
};

module.exports = Order;