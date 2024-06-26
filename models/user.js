const Sequelize = require('sequelize');
const sequelize = require("../util/database");

const User = sequelize.define('User', {
    id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true, 
      validate: {
        isEmail: true 
      }
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    totalExpense: {
      type: Sequelize.DOUBLE,
      allowNull: false,
      defaultValue: 0
    },
    isPremiumUser: {
      type:Sequelize.BOOLEAN,
      defaultValue: false
    }
  });

  module.exports = User;