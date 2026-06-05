import { Router } from "express";
import {
  createGroup,
  createPrivateChat,
  deleteMessage,
  getMessages,
  listChats,
  markRead,
  sendMessage
} from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", listChats);
router.post("/private", createPrivateChat);
router.post("/groups", createGroup);
router.get("/:chatId/messages", getMessages);
router.post("/:chatId/messages", sendMessage);
router.patch("/:chatId/read", markRead);
router.delete("/messages/:messageId", deleteMessage);

export default router;
