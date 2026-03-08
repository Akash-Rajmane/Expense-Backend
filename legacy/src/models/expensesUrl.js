const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const ExpensesUrl = sequelize.define('ExpensesUrl', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    url: {
        type: Sequelize.STRING(1024),
        allowNull: false,
    },
    fileName: {
        type: Sequelize.STRING(1024),
        allowNull: false,
    }
})

module.exports = ExpensesUrl;