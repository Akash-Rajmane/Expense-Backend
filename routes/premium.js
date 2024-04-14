const express = require('express');

const premiumController = require('../controllers/premium');

const premiumMiddleware = require('../middlewares/premiumMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');


const router = express.Router();

router.get('/get-leaderboard', authMiddleware.checkAuth, premiumMiddleware.isPremiumUser, premiumController.getLeaderboard);

module.exports = router;