import { Request, Response } from "express";
import client from "@repo/db";
import { CreateAvatarSchema, CreateElementSchema, CreateMapSchema, UpdateElementSchema } from "../../types";
import { parseDimensions } from "../../utils/dimensions";
import ResponseHelper from "../../utils/response";

export const createElementHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = CreateElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }

    const element = await client.element.create({
        data: {
            width: parsedData.data.width,
            height: parsedData.data.height,
            static: parsedData.data.static,
            imageUrl: parsedData.data.imageUrl,
        },
    });

    ResponseHelper.success(res, { id: element.id });
};

export const updateElementHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = UpdateElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }
    await client.element.update({
        where: {
            id: req.params.elementId,
        },
        data: {
            imageUrl: parsedData.data.imageUrl,
        },
    });
    ResponseHelper.success(res, { message: "Element updated" });
};

export const createAvatarHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = CreateAvatarSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }
    const avatar = await client.avatar.create({
        data: {
            name: parsedData.data.name,
            imageUrl: parsedData.data.imageUrl,
        },
    });
    ResponseHelper.success(res, { avatarId: avatar.id });
};

export const createMapHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = CreateMapSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }
    const { width, height } = parseDimensions(parsedData.data.dimensions);
    const map = await client.map.create({
        data: {
            name: parsedData.data.name,
            width,
            height,
            thumbnail: parsedData.data.thumbnail,
            mapElements: {
                create: parsedData.data.defaultElements.map((e: any) => ({
                    elementId: e.elementId,
                    x: e.x,
                    y: e.y,
                })),
            },
        },
    });

    ResponseHelper.success(res, { id: map.id });
};
