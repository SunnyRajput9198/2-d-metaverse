import { Response as ExpressResponse } from "express";

export default class ResponseHelper {
    static success(res: ExpressResponse, data: any, statusCode: number = 200): void {
        if (typeof data === "object" && data !== null && !Array.isArray(data)) {
            res.status(statusCode).json(data);
            return;
        }
        res.status(statusCode).json({ success: true, data });
    }

    static deleted(res: ExpressResponse, message: string = "Element deleted"): void {
        res.status(200).json({
            message,
        });
    }

    static error(res: ExpressResponse, error: any, statusCode: number = 400): void {
        const message = typeof error === "string" ? error : error?.message || "Internal server error";
        const code = error?.status || statusCode;
        res.status(code).json({
            message,
        });
    }
}
