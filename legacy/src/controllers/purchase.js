const Razorpay = require('razorpay');
require('dotenv').config();

const Order = require('../models/order');
const User = require("../models/user");

exports.purchasePremium = (req, res, next) => {
    try {
        let rzp = new Razorpay({
            key_id: process.env.RZP_KEY_ID,
            key_secret: process.env.RZP_KEY_SECRET
        });
        const amount = 10000;

        rzp.orders.create({ amount, currency: 'INR' }, async (err, order) => {
            if (err) {
                throw new Error(JSON.stringify(err));
            }
            try {
                
                if (!req.user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const newOrder = await Order.create({ orderId: order.id, status: "PENDING" });
                await req.user.addOrder(newOrder);
                res.status(201).json({ order, key_id: rzp.key_id });
            } catch (err) {
                throw new Error(err);
            }
        });
    } catch (err) {
        console.log(err);
        res.status(403).json({
            message: "Something went wrong",
            error: err
        });
    }
};

exports.updateTransactionStatus = async (req, res, next) => {
    try {
        const { payment_id, order_id } = req.body;
        const order = await Order.findOne({ where: { orderId: order_id } });
        await Promise.all([order.update({ paymentId: payment_id, status: 'SUCCESS' }), req.user.update({ isPremiumUser: true })])
        res.status(202).json({
            success: true,
            message: "Transaction Successful"
        });
    } catch (err) {
        console.log(err);
        res.status(403).json({
            message: "Something went wrong",
            error: err
        });
    }
}

exports.paymentFailed = async (req, res, next) => {
    try {
        const { order_id } = req.body;
        // console.log(req.body);
        const order = await Order.findOne({ where: { orderId: order_id } });
        await order.update({ status: 'FAILED' });
        res.json({
            success: true,
            message: "Payment failed"
        })
    } catch (err) {
        console.log(err);
        res.status(403).json({
            message: "Something went wrong",
            error: err
        });
    }
};