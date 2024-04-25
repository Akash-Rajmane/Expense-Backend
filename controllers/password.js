require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { createTransport } = require('nodemailer');

const ForgotPasswordRequest = require('../models/forgotPassword');
const sequelize = require('../util/database');

const User = require('../models/user');

exports.postForgotPassword = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {email} = req.body;

        const user = await User.findOne({ where: { email } })
        if (!user) {
            return res.status(404).json({ message: 'User with given email not found!' });
        }

        const data = await ForgotPasswordRequest.create({ id: uuidv4(), userId: user.id, isActive: true }, { transaction })

        const transporter = createTransport({
            host: "smtp-relay.brevo.com",
            port: 587,
            auth: {
                user: "akashrajmane007@gmail.com",
                pass: process.env.BREVO_SMTP_KEY,
            },
        });
        
        const mailOptions = {
            from: 'akashrajmane007@gmail.com',
            to: email,
            subject: 'Reset your password',
            html: `
            <p>Hello,</p>
            <p>You have requested to reset your password for Expense Tracker App. Click the link below to reset it:</p>
            <p><a href="http://localhost:3000/password/reset-password/${data.id}">Reset Password</a></p>
            <p>If you didn't request this, you can safely ignore this email.</p>
        `
        };
        
        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        await transaction.commit();
        res.json({
            success: true,
            message: "Email sent successfully"
        })
    } catch (err) {
        console.log(err)
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
};

