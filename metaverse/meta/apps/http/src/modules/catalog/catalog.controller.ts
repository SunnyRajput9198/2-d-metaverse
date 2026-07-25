import { Request, Response } from "express";
import client from "@repo/db";
import ResponseHelper from "../../utils/response";

export const getElementsHandler = async (req: Request, res: Response): Promise<void> => {
    const elements = await client.element.findMany();
    ResponseHelper.success(res, {
        elements: elements.map((e: any) => ({
            id: e.id,
            imageUrl: e.imageUrl,
            width: e.width,
            height: e.height,
            static: e.static,
        })),
    });
};

export const getAvatarsHandler = async (req: Request, res: Response): Promise<void> => {
    const avatars = await client.avatar.findMany();
    ResponseHelper.success(res, {
        avatars: avatars.map((x: any) => ({
            id: x.id,
            imageUrl: x.imageUrl,
            name: x.name,
        })),
    });
};
