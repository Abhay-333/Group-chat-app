import { Router } from "express";
import { login, me, register, searchUsers } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, me);
router.get("/users", protect, searchUsers);

export default router;
 