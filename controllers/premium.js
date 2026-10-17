const client = require("../util/database");
const User = require("../models/user");
const Expense = require("../models/expense");
const S3Services = require("../services/s3");
const DataConversionServices = require("../services/dataConversion");
const ExpensesUrl = require("../models/expensesUrl");

exports.getLeaderboard = async (req, res, next) => {
  try {
    const result = await client.query({
      query: `
        SELECT 
          u.name,
          coalesce(sum(s.totalExpense), 0) AS totalExpense
        FROM users u FINAL
        LEFT JOIN user_expense_summary s ON u.id = s.userId
        GROUP BY u.name, u.id
        ORDER BY totalExpense DESC
        LIMIT 100
      `,
      format: "JSONEachRow",
    });

    const arr = await result.json();

    res.json({
      success: true,
      data: arr,
      message: "Got user expenses successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCategorySummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    let dateFilter = "";
    const params = { userId };

    if (startDate && endDate) {
      dateFilter = "AND expenseDate >= {startDate:Date} AND expenseDate <= {endDate:Date}";
      params.startDate = startDate;
      params.endDate = endDate;
    }

    const result = await client.query({
      query: `
        SELECT 
          category,
          sum(totalAmount) AS totalSpent,
          sum(transactionCount) AS totalTransactions
        FROM user_category_daily_expenses
        WHERE userId = {userId:UUID} ${dateFilter}
        GROUP BY category
        ORDER BY totalSpent DESC
      `,
      query_params: params,
      format: "JSONEachRow",
    });

    const summary = await result.json();
    res.json({
      success: true,
      data: summary,
      message: "Got category summary successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getExpensesByInterval = async (req, res, next) => {
  try {
    const { interval } = req.params;
    const userId = req.user.id;
    let startDate, endDate;

    // Determine start and end dates based on interval
    switch (interval) {
      case "daily":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 6); // Last 7 days
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        break;
      case "monthly":
        startDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        );
        endDate = new Date(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        break;
      case "yearly":
        startDate = new Date(new Date().getFullYear(), 0, 1);
        endDate = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        return res.status(400).json({ message: "Invalid interval" });
    }

    // Fetch expenses within the date range for the given user
    const expenses = await Expense.findAll({
      where: {
        userId,
        createdAt: {
          between: [startDate, endDate],
        },
      },
    });

    if (!expenses || expenses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No expenses found for the specified interval",
      });
    }

    res.json({
      success: true,
      data: expenses,
      message: "Got user expenses by interval successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.downloadExpenses = async (req, res, next) => {
  throw new Error("feature not available");
  try {
    const expenses = await Expense.findByUserId(req.user.id);

    const csvData = DataConversionServices.convertToCSV(expenses);

    const fileName = `${
      req.user.id
    }/${new Date().toLocaleString()}_Expenses.csv`;

    const fileUrl = await S3Services.uploadToS3(csvData, fileName);

    await ExpensesUrl.create({
      url: fileUrl,
      fileName,
      userId: req.user.id,
    });

    res.status(200).json({ fileUrl, success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getDownloadedFilesUrls = async (req, res, next) => {
  throw new Error("feature not available");
  try {
    const expensesUrls = await ExpensesUrl.findByUserId(req.user.id, {
      attributes: ["url", "fileName", "id", "createdAt"],
    });

    res.status(200).json({ expensesUrls, success: true });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
