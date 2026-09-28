import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
import { NextFunction, Request, Response } from "express";

export const authMiddleware = (requiredRole?: "Admin" | "User") => {
    return (req: Request, res: Response, next: NextFunction) => {
        const header = req.headers["authorization"];
        const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : undefined;

        if (!token) {
            res.status(403).json({ message: "Unauthorized" });
            return;
        }

        try {
            const decoded = jwt.verify(token, JWT_PASSWORD, { algorithms: ["HS256"] });
            if (typeof decoded === "string" || typeof decoded.userId !== "string" || typeof decoded.role !== "string") {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }
            if (requiredRole && decoded.role !== requiredRole) {
                res.status(403).json({ message: "Unauthorized" });
                return;
            }
            req.userId = decoded.userId;
            next();
        } catch (e) {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }
    };
};
