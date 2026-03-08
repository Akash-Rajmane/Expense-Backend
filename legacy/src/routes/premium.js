const express = require('express');

const premiumController = require('../controllers/premium');

const premiumMiddleware = require('../middlewares/premiumMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');


const router = express.Router();

router.get('/get-leaderboard', authMiddleware.checkAuth, premiumMiddleware.isPremiumUser, premiumController.getLeaderboard);

router.get('/get-expenses-by-interval/:interval', authMiddleware.checkAuth, premiumMiddleware.isPremiumUser, premiumController.getExpensesByInterval);

router.get('/download-expenses', authMiddleware.checkAuth, premiumMiddleware.isPremiumUser, premiumController.downloadExpenses)

router.get('/get-downloaded-files-data', authMiddleware.checkAuth, premiumMiddleware.isPremiumUser, premiumController.getDownloadedFilesUrls);

module.exports = router;