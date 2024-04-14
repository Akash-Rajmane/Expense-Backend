const express = require('express');

const expenseController = require('../controllers/expense');
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get('/expenses/:userId', authMiddleware.checkAuth, expenseController.getAllExpensesByUserId);

router.post('/expenses/:userId/add-expense', authMiddleware.checkAuth, expenseController.postAddExpense);

router.put('/expenses/:userId/edit-expense',  authMiddleware.checkAuth, expenseController.putEditExpense);

router.delete('/expenses/:expenseId',  authMiddleware.checkAuth, expenseController.deleteExpense);

module.exports = router;