const Expense = require("../models/expense");
const User = require("../models/user");
const sequelize = require('../util/database');


exports.getAllExpensesByUser = async(req, res, next) => {
    try{
        const page = req.query.page;
        const limit =  Number(req.query.limit);
        const offset = (page-1)*limit;
       
        if (!page) {
            throw new Error("Page not found!");
        }

        
        const expenses = await req.user.getExpenses({limit,offset});
        
        
        if(!expenses){
            return res.status(404).json({message:"No expenses found"})
        }

        res.json(expenses);

    }catch(err){
        console.log(err);
    }
}

exports.getMaxPage = async (req, res, next) => {
    try{
        const limit =  Number(req.query.limit);

        const count = await req.user.countExpenses();
    
        const maxPage = count<limit? 1 : Math.ceil(count/limit);

        res.json(maxPage);
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
