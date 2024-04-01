const express = require('express');
const bodyParser = require('body-parser');
const sequelize = require("./util/database");
const cors = require('cors');
const userRoutes = require("./routes/user");

const app = express();
app.use(cors());
app.use(bodyParser.json());



app.use(userRoutes);

sequelize.sync({}).then(() => {
    app.listen(4000, () => {
      console.log('Server is running on port 4000');
    });
  });