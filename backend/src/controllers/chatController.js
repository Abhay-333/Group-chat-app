import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

const chatPopulate = [
  { path: "members", select: "name email avatar isOnline lastSeen" },
  { path: "admins", select: "name email avatar" },
  {
    path: "lastMessage",
    populate: { path: "sender", select: "name email avatar" }
  }
];

const messagePopulate = { path: "sender", select: "name email avatar" };

const ensureChatMember = async (chatId, userId) => {
  const chat = await Chat.findOne({ _id: chatId, members: userId });

  if (!chat) {
    throw Object.assign(new Error("Chat not found"), { status: 404 });
  }

  return chat;
};

export const listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate(chatPopulate)
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    next(error);
  }
};

export const createPrivateChat = async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: "Cannot start a chat with yourself" });
    }

    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId], $size: 2 }
    });

    if (!chat) {
      chat = await Chat.create({ members: [req.user._id, userId], isGroup: false });
    }

    const populatedChat = await chat.populate(chatPopulate);
    res.status(201).json(populatedChat);
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req, res, next) => {
  try {
    const { name, memberIds = [] } = req.body;
    const uniqueMemberIds = [...new Set([String(req.user._id), ...memberIds.map(String)])];

    if (!name?.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    if (uniqueMemberIds.length < 3) {
      return res.status(400).json({ message: "A group needs at least 3 members including you" });
    }

    const chat = await Chat.create({
      name: name.trim(),
      isGroup: true,
      members: uniqueMemberIds,
      admins: [req.user._id]
    });

    const populatedChat = await chat.populate(chatPopulate);
    res.status(201).json(populatedChat);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    await ensureChatMember(req.params.chatId, req.user._id);

    const messages = await Message.find({
      chat: req.params.chatId,
      deletedFor: { $ne: req.user._id }
    })
      .populate(messagePopulate)
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const chat = await ensureChatMember(req.params.chatId, req.user._id);
    let message = await Message.create({
      chat: chat._id,
      sender: req.user._id,
      content: content.trim(),
      readBy: [req.user._id]
    });

    chat.lastMessage = message._id;
    await chat.save();

    message = await message.populate(messagePopulate);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    await ensureChatMember(req.params.chatId, req.user._id);

    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.json({ chatId: req.params.chatId, readBy: req.user._id });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await ensureChatMember(message.chat, req.user._id);

    if (String(message.sender) === String(req.user._id)) {
      await message.deleteOne();
      return res.json({ messageId: req.params.messageId, deleted: true });
    }

    message.deletedFor.addToSet(req.user._id);
    await message.save();
    res.json({ messageId: req.params.messageId, deletedForMe: true });
  } catch (error) {
    next(error);
  }
};
