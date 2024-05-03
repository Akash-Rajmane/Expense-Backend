const express = require('express');

const expenseController = require('../controllers/expense');
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get('/get-expenses', authMiddleware.checkAuth, expenseController.getAllExpensesByUser);

router.get('/get-lastpage-number', authMiddleware.checkAuth, expenseController.getMaxPage);

router.post('/expenses/add-expense', authMiddleware.checkAuth, expenseController.postAddExpense);

router.delete('/expenses/:expenseId',  authMiddleware.checkAuth, expenseController.deleteExpense);

module.exports = router;