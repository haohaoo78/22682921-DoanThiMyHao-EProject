const jwt = require("jsonwebtoken");
require("dotenv").config();

function isAuthenticated(req, res, next) {
  // Check for the presence of an authorization header
  const authHeader = req.headers.authorization; // lay header authorization
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1]; // lay token tu header

  try {
    // Verify the token using the JWT library and the secret key
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // giai ma token
    req.user = decodedToken; // luu thong tin nguoi dung vao req.user
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Unauthorized" }); // neu token khong hop le thi tra ve 401
  }
}

module.exports = isAuthenticated;
