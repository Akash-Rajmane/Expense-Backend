const User = require("../models/user");


exports.isPremiumUser = async (req, res, next) => {
    const user = await User.findByPk(req.user.userId);
    
    if (user.isPremiumUser) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: "Not a premium user!"
        })
    }
};