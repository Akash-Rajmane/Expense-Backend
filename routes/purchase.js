const express = require('express');

const purchaseController = require('../controllers/purchase');

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get('/premium-membership', authMiddleware.checkAuth, purchaseController.purchasePremium);

router.post('/update-transaction-status', authMiddleware.checkAuth, purchaseController.updateTransactionStatus);

router.post('/payment-failed', authMiddleware.checkAuth, purchaseController.paymentFailed);

module.exports = router;