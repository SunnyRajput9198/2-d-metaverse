import { Request, Response } from "express";
import client from "@repo/db";
import jwt from "jsonwebtoken";
import { SigninSchema, SignupSchema } from "../../types";
import { hash, compare } from "../../scrypt";
import { JWT_PASSWORD } from "../../config";
import ResponseHelper from "../../utils/response";
import { timingSafeEqual } from "node:crypto";

export const signupHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = SignupSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }

    if (parsedData.data.type === "admin") {
        const configuredSecret = process.env.ADMIN_SIGNUP_SECRET;
        const providedSecret = parsedData.data.adminSecret ?? "";
        const expected = Buffer.from(configuredSecret ?? "");
        const provided = Buffer.from(providedSecret);
        if (!configuredSecret || expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
            ResponseHelper.error(res, "Administrator signup is unavailable or the setup secret is invalid", 403);
            return;
        }
    }

    const hashedPassword = await hash(parsedData.data.password);

    try {
        const user = await client.user.create({
            data: {
                username: parsedData.data.username,
                password: hashedPassword,
                role: parsedData.data.type === "admin" ? "Admin" : "User",
            },
        });
        ResponseHelper.success(res, { userId: user.id });
    } catch (e: any) {
        ResponseHelper.error(res, "User already exists", 400);
    }
};

export const signinHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 403);
        return;
    }

    try {
        const user = await client.user.findUnique({
            where: {
                username: parsedData.data.username,
            },
        });

        if (!user) {
            ResponseHelper.error(res, "User not found", 403);
            return;
        }
        const isValid = await compare(parsedData.data.password, user.password);

        if (!isValid) {
            ResponseHelper.error(res, "Invalid password", 403);
            return;
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
            },
            JWT_PASSWORD,
            { expiresIn: "7d", algorithm: "HS256" }
        );

        ResponseHelper.success(res, {
            userId: user.id,
            username: user.username,
            avatarId: user.avatarId,
            token,
        });
    } catch (e) {
        ResponseHelper.error(res, "Internal server error", 400);
    }
};
