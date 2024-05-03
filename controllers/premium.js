const User = require('../models/user');
const Expense = require('../models/expense');
const sequelize = require('../util/database');
const { Op } = require('sequelize');
const S3Services = require('../services/s3');
const DataConversionServices = require("../services/dataConversion");
const ExpensesUrl = require("../models/expensesUrl");

exports.getLeaderboard = async (req, res, next) => {
    try {
    
        // const arr = await User.findAll({
        //     attributes: ['name', [sequelize.fn('sum', sequelize.col('expenses.amount')), 'totalAmount']],
        //     include: [
        //         {
        //             model: Expense,
        //             attributes: []
        //         }
        //     ],
        //     group: ['user.id'],
        //     order: [['totalAmount', 'DESC']]
        // })
        
        const arr = await User.findAll({
            attributes: ['name', 'totalExpense'],
            order: [['totalExpense', 'DESC']]
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



exports.getExpensesByInterval = async (req, res, next) => {
    try {
        const { interval } = req.params;
        const userId = req.user.id;
        let startDate, endDate;

        // Determine start and end dates based on interval
        switch (interval) {
            case 'daily':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'weekly':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 6); // Last 7 days
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'monthly':
                startDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                endDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'yearly':
                startDate = new Date(new Date().getFullYear(), 0, 1);
                endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
                break;
            default:
                return res.status(400).json({ message: 'Invalid interval' });
        }

        // Fetch expenses within the date range for the given user
        const expenses = await Expense.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });
        
        if (!expenses || expenses.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No expenses found for the specified interval' 
            });
        }

        res.json({
            success: true,
            data: expenses,
            message: "Got user expenses by interval successfully"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ 
            success: false,
            message: err.message
        });
    }
};

exports.downloadExpenses = async (req, res, next) => {
    try {
        const expenses = await req.user.getExpenses();
       
        const csvData = DataConversionServices.convertToCSV(expenses);
       
        const fileName = `${req.user.id}/${new Date().toLocaleString()}_Expenses.csv`;
       
        const fileUrl = await S3Services.uploadToS3(csvData, fileName);
        
        await req.user.createExpensesUrl({ url: fileUrl, fileName });
        
        res.status(200).json({ fileUrl, success: true })
    
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
};

exports.getDownloadedFilesUrls = async (req, res, next) => {
    try{
        const expensesUrls = await req.user.getExpensesUrls({ attributes: ['url', 'fileName', 'id', 'createdAt']})

        res.status(200).json({ expensesUrls, success: true })

    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}
