const Expense = require("../models/expense");
const User = require("../models/user");


exports.getAllExpensesByUserId = async(req, res, next) => {
    try{
        const { userId } = req.params;
        const expenses = await Expense.findAll({where:{userId}});

        if(!expenses){
            return res.status(404).json({message:"No expenses found"})
        }

        res.json(expenses);

    }catch(err){

    }
}

exports.postAddExpense = async(req, res, next) => {
    try{
        const { userId } = req.params;
        const { amount, description, category } = req.body;
        const user = await User.findByPk(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        const newExpense = await Expense.create({ amount, description, category });
        await user.addExpense(newExpense);
        res.status(201).json(newExpense);
    }catch(err){
        console.log(err);
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
    try {
        const { expenseId } = req.params;
        const expense = await Expense.findByPk(expenseId);
        if (!expense) {
          return res.status(404).json({ error: 'Expense not found' });
        }
        await expense.destroy();
        res.sendStatus(204); // No content
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal server error' });
      }
};
