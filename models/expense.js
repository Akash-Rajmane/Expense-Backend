const Sequelize = require('sequelize');
const sequelize = require("../util/database");


const Expense = sequelize.define('Expense', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },

});


module.exports = Expense;
