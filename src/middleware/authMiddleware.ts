import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.secret;
  if (!secret) {
    return res
      .status(500)
      .json({ error: "contact admin server data not present" });
  } else {
    const authHeader = req.headers.authorization;

    if (!authHeader) return res.status(401).json({ error: "Missing token" });

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, secret) as any;

      if (decoded.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }
}
