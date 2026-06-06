import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

const router = Router();

router.post("/register", async (req: Request, res: Response) => {
  const { email, password, name, phone, role } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({ email, password: hash, name, phone, role: role ?? "usuario" });
    res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (err: any) {
    if (err.code === 11000) res.status(409).json({ error: "Email ya registrado" });
    else res.status(500).json({ error: "Error al registrar" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
  res.json({ token, role: user.role, name: user.name });
});

export default router;
