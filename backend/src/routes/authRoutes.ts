import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Customer } from "../models/Customer";
import { Admin } from "../models/Admin";
import { Driver } from "../models/Driver";
import { AuthSession } from "../models/AuthSession";

const router = Router();

const MODELS = {
  customer: Customer,
  admin: Admin,
  driver: Driver,
} as const;

type Rol = keyof typeof MODELS;

function isValidRol(r: string): r is Rol {
  return r in MODELS;
}

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, nombre, nombre_negocio, telefono, rol = "customer", ...rest } = req.body;
  if (!isValidRol(rol)) {
    res.status(400).json({ error: "rol inválido (customer | admin | driver)" });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const name = nombre || nombre_negocio || email;
  try {
    const Model = MODELS[rol] as any;
    const doc = await Model.create({
      email,
      password_hash: hash,
      nombre: name,
      nombre_negocio: nombre_negocio || name,
      telefono,
      ...rest,
    });
    res.status(201).json({ id: doc._id, email: doc.email, rol });
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: "Email ya registrado" });
    } else {
      res.status(500).json({ error: "Error al registrar", detail: err.message });
    }
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password, rol = "customer" } = req.body;
  if (!isValidRol(rol)) {
    res.status(400).json({ error: "rol inválido" });
    return;
  }
  const Model = MODELS[rol] as any;
  const doc = await Model.findOne({ email }).select("+password_hash");
  if (!doc || !(await bcrypt.compare(password, doc.password_hash))) {
    res.status(401).json({ error: "Credenciales inválidas" });
    return;
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = jwt.sign(
    { userId: doc._id.toString(), rol },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  await AuthSession.create({ rol, ref_id: doc._id, jwt_token: token, expires_at: expiresAt });

  await Model.findByIdAndUpdate(doc._id, { last_login: new Date() });

  res.json({
    token,
    rol,
    nombre: doc.nombre || doc.nombre_negocio,
    id: doc._id,
  });
});

// POST /api/auth/logout
router.post("/logout", async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    await AuthSession.findOneAndDelete({ jwt_token: header.slice(7) });
  }
  res.json({ ok: true });
});

export default router;
