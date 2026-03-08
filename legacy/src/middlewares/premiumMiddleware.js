const User = require("../models/user");


exports.isPremiumUser = async (req, res, next) => {
    if (req.user.isPremiumUser) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: "Not a premium user!"
        })
    }
};