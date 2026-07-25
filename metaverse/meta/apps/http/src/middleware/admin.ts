import { authMiddleware } from "./auth";

export const adminMiddleware = authMiddleware("Admin");