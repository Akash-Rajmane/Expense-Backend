const Expense = require("../models/expense");
const User = require("../models/user");
const sequelize = require('../util/database');


exports.getAllExpensesByUser = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        const offset = (page - 1) * limit;

        if (!page) {
            throw new Error("Page not found!");
        }

        const [expenses, totalCount] = await Promise.all([
            req.user.getExpenses({ limit, offset }),
            req.user.countExpenses()
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
            lastPage: totalPages
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}


exports.postAddExpense = async(req, res, next) => {
    const transaction = await sequelize.transaction();
    try{
        const { amount, description, category } = req.body;
        const newExpense = await req.user.createExpense({ amount, description, category }, { transaction });
        req.user.totalExpense += Number(amount);
        await req.user.save({ transaction });
        await transaction.commit();
        res.status(201).json(newExpense);
    }catch(err){
        console.log(err);
        await transaction.rollback();
        res.status(500).json({ error: 'Failed to add expense' });
    }
};


exports.deleteExpense = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { expenseId } = req.params;
        const expense = await Expense.findByPk(expenseId, {transaction});
        
        if (!expense) {
          return res.status(404).json({ error: 'Expense not found' });
        }
        await expense.destroy({transaction});
        
        req.user.totalExpense -= expense.amount;
        await req.user.save({ transaction });
        await transaction.commit();
        
        res.sendStatus(204); // No content
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
      }
};
