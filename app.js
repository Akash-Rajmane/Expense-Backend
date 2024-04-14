const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require("./util/database");
const cors = require('cors');
const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const purchaseRoutes = require("./routes/purchase");
const premiumRoutes = require("./routes/premium");
const User = require("./models/user");
const Expense = require("./models/expense");
const Order = require('./models/order');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Relationships
User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);


app.use(userRoutes);
app.use(expenseRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/premium',premiumRoutes);

sequelize.sync().then(() => {
    app.listen(4000, () => {
      console.log('Server is running on port 4000');
    });
  });