import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userRol?: string;
}

export function auth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token requerido" });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as {
      userId: string;
      rol: string;
    };
    req.userId = payload.userId;
    req.userRol = payload.rol;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.userRol ?? "")) {
      res.status(403).json({ error: "Sin permisos" });
      return;
    }
    next();
  };
}
