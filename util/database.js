require('dotenv').config();

const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE, process.env.USER, process.env.PASSWORD,
     {dialect: 'mysql', host: process.env.HOST, port: process.env.DB_PORT})

module.exports = sequelize;