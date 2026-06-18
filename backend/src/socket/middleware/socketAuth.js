import jwt from "jsonwebtoken";
import User from "../../models/User.js";

const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication token missing"));
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(payload.userId).select("-password");

        if (!user) {
            return next(new Error("User not found"));
        }

        socket.user = user;
        next();
    } catch (error) {
        next(new Error("Socket authentication failed"));
    }
}

export default socketAuth