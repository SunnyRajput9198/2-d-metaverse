import { Request, Response } from "express";
import client from "@repo/db";
import jwt from "jsonwebtoken";
import { SigninSchema, SignupSchema } from "../../types";
import { hash, compare } from "../../scrypt";
import { JWT_PASSWORD } from "../../config";
import ResponseHelper from "../../utils/response";

export const signupHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = SignupSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
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
            JWT_PASSWORD
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
