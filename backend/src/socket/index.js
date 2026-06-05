import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true
    }
  });

  io.use(async (socket, next) => {
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
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.user._id);
    console.log(`Socket connected: ${socket.id}`);

    socket.join(userId);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit("user:online", { userId });

    const chats = await Chat.find({ members: socket.user._id }).select("_id");
    chats.forEach((chat) => socket.join(String(chat._id)));

    socket.on("chat:join", async ({ chatId }) => {
      const chat = await Chat.findOne({ _id: chatId, members: socket.user._id });
      if (chat) {
        socket.join(String(chat._id));
      }
    });

    socket.on("message:send", async ({ chatId, content }, callback) => {
      try {
        if (!content?.trim()) {
          return callback?.({ ok: false, message: "Message content is required" });
        }

        const chat = await Chat.findOne({ _id: chatId, members: socket.user._id });
        if (!chat) {
          return callback?.({ ok: false, message: "Chat not found" });
        }

        let message = await Message.create({
          chat: chat._id,
          sender: socket.user._id,
          content: content.trim(),
          readBy: [socket.user._id]
        });

        chat.lastMessage = message._id;
        await chat.save();

        message = await message.populate({ path: "sender", select: "name email avatar" });
        io.to(String(chat._id)).emit("message:new", message);
        callback?.({ ok: true, message });
      } catch (error) {
        callback?.({ ok: false, message: "Could not send message" });
      }
    });

    socket.on("typing:start", ({ chatId }) => {
      socket.to(chatId).emit("typing:start", { chatId, user: socket.user.toPublicJSON() });
    });

    socket.on("typing:stop", ({ chatId }) => {
      socket.to(chatId).emit("typing:stop", { chatId, userId });
    });

    socket.on("message:read", async ({ chatId }) => {
      await Message.updateMany(
        { chat: chatId, readBy: { $ne: socket.user._id } },
        { $addToSet: { readBy: socket.user._id } }
      );
      io.to(chatId).emit("message:read", { chatId, userId });
    });

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit("user:offline", { userId, lastSeen: new Date() });
    });
  });

  return io;
};
