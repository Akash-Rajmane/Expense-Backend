const express = require('express');

const userController = require('../controllers/user');

const router = express.Router();


router.get('/get-user/:userId', userController.getUser);

router.post('/add-user', userController.postSignUpUser);

router.post('/login', userController.postLogInUser);

module.exports = router;