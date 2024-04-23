const Expense = require("../models/expense");
const User = require("../models/user");
const sequelize = require('../util/database');


exports.getAllExpensesByUser = async(req, res, next) => {
    try{
        const expenses = await req.user.getExpenses();
        if(!expenses){
            return res.status(404).json({message:"No expenses found"})
        }

        res.json(expenses);

    }catch(err){
        console.log(err);
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

exports.putEditExpense = async (req, res, next) => {
    try {
        const expenseId = req.params.expenseId;
        const { amount, description, category } = req.body;

        // Find the expense by ID
        const expense = await Expense.findByPk(expenseId);

        // If expense not found, return 404 Not Found
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        const updatedExpense = await Expense.update({ amount, description, category }, { where: { id : expenseId } });
        res.status(200).json(updatedExpense);

    } catch (error) {
        // Handle errors
        console.log(error);
        res.status(500).json({ error: 'Failed to update expense' });
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
