const express = require('express');

const userController = require('../controllers/user');

const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");


router.get('/is-premium-user', authMiddleware.checkAuth, userController.getIsPremiumUser);

router.post('/add-user', userController.postSignUpUser);

router.post('/login', userController.postLogInUser);

module.exports = router;