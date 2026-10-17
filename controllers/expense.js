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
  // NOTE: ClickHouse does not support ACID transactions.
  // The expense creation and user totalExpense update are NOT atomic.
  // A failure between the two operations could leave totalExpense out of sync.
  try {
    const { amount, description, category } = req.body;

    const newExpense = await Expense.create({
      amount,
      description,
      category,
      userId: req.user.id,
    });

    const newTotal = Number(req.user.totalExpense) + Number(amount);
    await User.update(req.user.id, { totalExpense: newTotal });

    res.status(201).json(newExpense);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to add expense" });
  }
};

exports.deleteExpense = async (req, res, next) => {
  // NOTE: ClickHouse DELETE is an async mutation — the row may not disappear immediately.
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await Expense.deleteById(expenseId);

    const newTotal = Number(req.user.totalExpense) - Number(expense.amount);
    await User.update(req.user.id, { totalExpense: newTotal });

    res.sendStatus(204); // No content
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};