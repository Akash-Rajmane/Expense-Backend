const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require("./util/database");
const cors = require('cors');
const helmet = require('helmet');
const userRoutes = require("./routes/user");
const expenseRoutes = require("./routes/expense");
const purchaseRoutes = require("./routes/purchase");
const premiumRoutes = require("./routes/premium");
const passwordRoutes = require("./routes/password");
const User = require("./models/user");
const Expense = require("./models/expense");
const Order = require('./models/order');
const ForgotPasswordRequest = require('./models/forgotPassword');
const ExpensesUrl = require("./models/expensesUrl");
const morgan = require('morgan');

const app = express();

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use(cors());
app.use(helmet());
app.use(morgan('combined', { stream: accessLogStream }));
app.use(bodyParser.json());

// Relationships
User.hasMany(Expense);
Expense.belongsTo(User);

User.hasMany(Order);
Order.belongsTo(User);

User.hasMany(ForgotPasswordRequest);
ForgotPasswordRequest.belongsTo(User);

User.hasMany(ExpensesUrl);
ExpensesUrl.belongsTo(User);


app.use(userRoutes);
app.use(expenseRoutes);
app.use('/purchase', purchaseRoutes);
app.use('/premium', premiumRoutes);
app.use('/password', passwordRoutes);

sequelize.sync().then(() => {
    app.listen(4000, () => {
      console.log('Server is running on port 4000');
    });
  });