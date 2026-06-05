import { Router } from "express";

const router = Router();

router.post("/register", (req, res) => {
  res.status(501).json({ message: "Registration is not implemented yet" });
});

router.post("/login", (req, res) => {
  res.status(501).json({ message: "Login is not implemented yet" });
});

export default router;
