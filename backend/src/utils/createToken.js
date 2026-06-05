import jwt from "jsonwebtoken";

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw Object.assign(new Error("JWT_SECRET is not configured"), { status: 500 });
  }

  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
};

export default createToken;
