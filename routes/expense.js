const express = require('express');

const expenseController = require('../controllers/expense');
const middleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get('/expenses/:userId', middleware.checkAuth, expenseController.getAllExpensesByUserId);

router.post('/expenses/:userId/add-expense', middleware.checkAuth, expenseController.postAddExpense);

router.put('/expenses/:userId/edit-expense',  middleware.checkAuth, expenseController.putEditExpense);

router.delete('/expenses/:expenseId',  middleware.checkAuth, expenseController.deleteExpense);

module.exports = router;