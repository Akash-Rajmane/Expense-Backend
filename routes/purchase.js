const express = require('express');

const purchaseController = require('../controllers/purchase');

const middleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get('/premium-membership', middleware.checkAuth, purchaseController.purchasePremium);

router.post('/update-transaction-status', middleware.checkAuth, purchaseController.updateTransactionStatus);

router.post('/payment-failed', middleware.checkAuth, purchaseController.paymentFailed);

module.exports = router;