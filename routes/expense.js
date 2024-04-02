const express = require('express');

const expenseController = require('../controllers/expense');

const router = express.Router();

router.get('/expenses/:userId', expenseController.getAllExpensesByUserId);

router.post('/expenses/:userId/add-expense', expenseController.postAddExpense);

router.put('/expenses/:userId/edit-expense', expenseController.putEditExpense);

router.delete('/expenses/:expenseId', expenseController.deleteExpense);

module.exports = router;