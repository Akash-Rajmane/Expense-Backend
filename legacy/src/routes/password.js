const express = require('express');

const passwordController = require('../controllers/password');

const router = express.Router();

router.get('/reset-password/:uuid', passwordController.getResetPassword);

router.post('/forgot-password', passwordController.postForgotPassword);

router.post('/update-password/:uuid', passwordController.postUpdatePassword);


module.exports = router;