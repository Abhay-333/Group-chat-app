import User from "../models/User.js";
import createToken from "../utils/createToken.js";

const authResponse = (user) => ({
  token: createToken(user._id),
  user: user.toPublicJSON()
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const user = await User.create({ name, email, password });
    res.status(201).json(authResponse(user));
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json(authResponse(user));
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const searchUsers = async (req, res, next) => {
  try {
    const query = req.query.q?.trim();

    if (!query) {
      return res.json([]);
    }

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } }
      ]
    })
      .select("name email avatar isOnline lastSeen")
      .limit(10);

    res.json(users);
  } catch (error) {
    next(error);
  }
};
