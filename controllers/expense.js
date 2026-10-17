const client = require("../util/database");
const Expense = require("../models/expense");
const User = require("../models/user");

exports.getAllExpensesByUser = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const offset = (page - 1) * limit;

    if (!page) {
      throw new Error("Page not found!");
    }

    const [expenses, totalCount] = await Promise.all([
      Expense.findByUserId(req.user.id, { limit, offset }),
      Expense.countByUserId(req.user.id),
    ]);

    if (!expenses) {
      return res.status(404).json({ message: "No expenses found" });
    }

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      expenses,
      currPage: page,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
      hasNextPage,
      hasPrevPage,
      lastPage: totalPages,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.postAddExpense = async (req, res, next) => {
  try {
    const { amount, description, category } = req.body;

    // Creating expense automatically triggers the materialized views:
    // - user_expense_summary_mv (updates user total and count)
    // - user_category_daily_expenses_mv (updates daily and category totals)
    const newExpense = await Expense.create({
      amount,
      description,
      category,
      userId: req.user.id,
    });

    res.status(201).json(newExpense);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to add expense" });
  }
};

exports.deleteExpense = async (req, res, next) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await Expense.deleteById(expenseId);

    // Compensate in SummingMergeTree destination tables for the deleted expense
    const expenseDate = new Date(expense.createdAt).toISOString().split("T")[0];
    await Promise.all([
      client.insert({
        table: "user_expense_summary",
        values: [
          {
            userId: req.user.id,
            totalExpense: -Number(expense.amount),
            totalCount: 0,
          },
        ],
        format: "JSONEachRow",
      }),
      client.insert({
        table: "user_category_daily_expenses",
        values: [
          {
            userId: req.user.id,
            expenseDate: expenseDate,
            category: expense.category,
            totalAmount: -Number(expense.amount),
            transactionCount: 0,
          },
        ],
        format: "JSONEachRow",
      }),
    ]);

    res.sendStatus(204); // No content
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};