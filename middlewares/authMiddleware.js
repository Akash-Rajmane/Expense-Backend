const createHttpError = require("http-errors");
const jwt = require("jsonwebtoken");

const checkAuth = async function (req, res, next) {
  if (!req.headers["authorization"]){
    const unauthorizedError = new Error("Unauthorized");
    unauthorizedError.status = 401;
    return next(unauthorizedError);
  }

  const bearerToken = req.headers["authorization"];
  const token = bearerToken.split(" ")[1];
  
  jwt.verify(token, `${process.env.JWT_SECRET}`, (err) => {
    if (err) {
        const unauthorizedError = new Error("Unauthorized");
        unauthorizedError.status = 401;
        return next(unauthorizedError);
    }
    const decodedToken = jwt.verify(token, `${process.env.JWT_SECRET}`);
    req.user = { userId: decodedToken.userId };
    next();
  });
}

exports.checkAuth = checkAuth;
