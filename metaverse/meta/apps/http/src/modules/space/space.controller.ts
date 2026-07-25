import { Request, Response } from "express";
import client from "@repo/db";
import { AddElementSchema, CreateSpaceSchema, DeleteElementSchema } from "../../types";
import { parseDimensions } from "../../utils/dimensions";
import ResponseHelper from "../../utils/response";

export const createSpaceHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = CreateSpaceSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }
    const { imageUrl } = parsedData.data;

    if (!parsedData.data.mapId) {
        const { width, height } = parseDimensions(parsedData.data.dimensions);
        const space = await client.space.create({
            data: {
                name: parsedData.data.name,
                width,
                height,
                creatorId: req.userId!,
                thumbnail: imageUrl || null,
            },
        });
        ResponseHelper.success(res, { spaceId: space.id });
        return;
    }

    const map = await client.map.findFirst({
        where: {
            id: parsedData.data.mapId,
        },
        select: {
            mapElements: true,
            width: true,
            height: true,
            thumbnail: true,
        },
    });

    if (!map) {
        ResponseHelper.error(res, "Map not found", 400);
        return;
    }

    let space = await client.$transaction(
        async () => {
            const space = await client.space.create({
                data: {
                    name: parsedData.data.name,
                    width: map.width,
                    height: map.height,
                    creatorId: req.userId!,
                    thumbnail: imageUrl || map.thumbnail || null,
                },
            });

            await client.spaceElements.createMany({
                data: map.mapElements.map((e: any) => ({
                    spaceId: space.id,
                    elementId: e.elementId,
                    x: e.x!,
                    y: e.y!,
                })),
            });

            return space;
        },
        { timeout: 15000 }
    );
    ResponseHelper.success(res, { spaceId: space.id });
};

export const deleteSpaceElementHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = DeleteElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }
    const spaceElement = await client.spaceElements.findFirst({
        where: {
            id: parsedData.data.id,
        },
        include: {
            space: true,
        },
    });

    if (!spaceElement?.space.creatorId || spaceElement.space.creatorId !== req.userId) {
        ResponseHelper.error(res, "Unauthorized", 403);
        return;
    }
    await client.spaceElements.delete({
        where: {
            id: parsedData.data.id,
        },
    });
    ResponseHelper.deleted(res, "Element deleted");
};

export const deleteSpaceHandler = async (req: Request, res: Response): Promise<void> => {
    const space = await client.space.findUnique({
        where: {
            id: req.params.spaceId,
        },
        select: {
            creatorId: true,
        },
    });
    if (!space) {
        ResponseHelper.error(res, "Space not found", 400);
        return;
    }

    if (space.creatorId !== req.userId) {
        ResponseHelper.error(res, "Unauthorized", 403);
        return;
    }

    await client.space.delete({
        where: {
            id: req.params.spaceId,
        },
    });
    ResponseHelper.deleted(res, "Space deleted");
};

export const getUserSpacesHandler = async (req: Request, res: Response): Promise<void> => {
    const spaces = await client.space.findMany({
        where: {
            creatorId: req.userId!,
        },
    });

    ResponseHelper.success(res, {
        spaces: spaces.map((s: any) => ({
            id: s.id,
            name: s.name,
            imageUrl: s.thumbnail,
            dimensions: `${s.width}x${s.height}`,
        })),
    });
};

export const addSpaceElementHandler = async (req: Request, res: Response): Promise<void> => {
    const parsedData = AddElementSchema.safeParse(req.body);
    if (!parsedData.success) {
        ResponseHelper.error(res, "Validation failed", 400);
        return;
    }
    const space = await client.space.findUnique({
        where: {
            id: req.body.spaceId,
            creatorId: req.userId!,
        },
        select: {
            width: true,
            height: true,
        },
    });

    if (!space) {
        ResponseHelper.error(res, "Space not found", 400);
        return;
    }

    if (req.body.x < 0 || req.body.y < 0 || req.body.x > space.width || req.body.y > space.height) {
        ResponseHelper.error(res, "Point is outside of the boundary", 400);
        return;
    }
    await client.spaceElements.create({
        data: {
            spaceId: req.body.spaceId,
            elementId: req.body.elementId,
            x: req.body.x,
            y: req.body.y,
        },
    });

    ResponseHelper.success(res, { message: "Element added" });
};

export const getSpaceByIdHandler = async (req: Request, res: Response): Promise<void> => {
    const space = await client.space.findUnique({
        where: {
            id: req.params.spaceId,
        },
        include: {
            elements: {
                include: {
                    element: true,
                },
            },
        },
    });

    if (!space) {
        ResponseHelper.error(res, "Space not found", 400);
        return;
    }

    ResponseHelper.success(res, {
        dimensions: `${space.width}x${space.height}`,
        imageUrl: space.thumbnail,
        name: space.name,
        id: space.id,
        elements: space.elements.map((e: any) => ({
            id: e.id,
            element: {
                id: e.element.id,
                imageUrl: e.element.imageUrl,
                width: e.element.width,
                height: e.element.height,
                static: e.element.static,
            },
            x: e.x,
            y: e.y,
        })),
    });
};
