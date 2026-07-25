import { Request, Response } from "express";
import client from "@repo/db";
import { UpdateMetadataSchema } from "../../types";
import ResponseHelper from "../../utils/response";

export const updateMetadataHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = UpdateMetadataSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }
    try {
        await client.user.update({
            where: { id: req.userId },
            data: { avatarId: parsedData.data.avatarId },
        });
        ResponseHelper.success(res, { message: "Metadata updated" });
    } catch (e) {
        ResponseHelper.error(res, "Internal server error", 400);
    }
};

export const getBulkMetadataHandler = async (req: Request, res: Response): Promise<void> => {
    const userIdString = (req.query.ids ?? "[]") as string;
    const userIds = userIdString.slice(1, userIdString.length - 1).split(",");

    const metadata = await client.user.findMany({
        where: {
            id: {
                in: userIds,
            },
        },
        select: {
            avatar: true,
            id: true,
        },
    });

    ResponseHelper.success(res, {
        avatars: metadata.map((m: any) => ({
            userId: m.id,
            avatarId: m.avatar?.imageUrl,
        })),
    });
};
