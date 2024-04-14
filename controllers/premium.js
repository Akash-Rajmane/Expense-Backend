const User = require('../models/user');
const Expense = require('../models/expense');
const sequelize = require('../util/database');

exports.getLeaderboard = async (req, res, next) => {
    try {
    
        const arr = await User.findAll({
            attributes: ['name', [sequelize.fn('sum', sequelize.col('expenses.amount')), 'totalAmount']],
            include: [
                {
                    model: Expense,
                    attributes: []
                }
            ],
            group: ['user.id'],
            order: [['totalAmount', 'DESC']]
        })

        res.json({
            success: true,
            data: arr,
            message: "Got user expenses successfully"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
};