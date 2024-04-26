require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { createTransport } = require('nodemailer');

const path = require('path');
const bcrypt = require('bcrypt');

const rootDir = require('../util/path');

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
        
        const url = `http://localhost:3000/password/reset-password/${data.dataValues.id}`;
        
        const mailOptions = {
            from: 'akashrajmane007@gmail.com',
            to: email,
            subject: 'Reset your password',
            html: `
            <p>Hello,</p>
            <p>You have requested to reset your password for Expense Tracker App. Click the link below to reset it:</p>
            <p><a href="${url}">Reset Password</a></p>
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

exports.getResetPassword = async (req, res, next) => {
    const {uuid} = req.params;
    
    try {
        const request = await ForgotPasswordRequest.findOne({where: {id:uuid}});
        //console.log("request",request);
        if (!request) {
            return res.status(404).json({ message: 'Reset password request not found' });
        }else if(!request.isActive){
            return res.status(401).json({message:'Reset password request is already expired!'})
        }

        res.sendFile(path.join(rootDir, 'views', 'resetPassword.html'));
     
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

exports.postUpdatePassword = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const uuid = req.params.uuid;
        const { password } = req.body;
        
        const request = await ForgotPasswordRequest.findByPk(uuid);
        //console.log(request,password);

        if (!request) {
            throw new Error("Incorrect link")
        }
        request.isActive = false;
        await request.save({ transaction });
        
        const userId = request.userId;
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error("User not present");
        }
        
        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if(err){
                console.log(err);
            }
            
            if (hash) {
                user.password = hash;
                await user.save({ transaction });
                await transaction.commit();
                res.json({
                    success: true,
                    message: "Password updated successfully!"
                })
                //console.log("Password updated successfully!");
            }
        })
    } catch (err) {
        console.log(err);
        transaction.rollback();
        res.status(401).json({
            success: false,
            message: err.message
        })
    }
}
