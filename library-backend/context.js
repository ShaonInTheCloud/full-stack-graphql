const jwt = require("jsonwebtoken");
const User = require("./models/user");
module.exports = async (authorization) => {
  if (!authorization?.startsWith("Bearer ")) return { currentUser: null };
  try {
    const payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    return { currentUser: await User.findById(payload.id) };
  } catch {
    return { currentUser: null };
  }
};
