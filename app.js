const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require("./util/database");
const cors = require('cors');
const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const User = require("./models/user");
const Expense = require("./models/expense");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Relationships
User.hasMany(Expense);
Expense.belongsTo(User);

app.use(userRoutes);
app.use(expenseRoutes);

sequelize.sync().then(() => {
    app.listen(4000, () => {
      console.log('Server is running on port 4000');
    });
  });