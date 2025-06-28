import { Router } from "express";
import client from "@repo/db";
import { Request, Response } from "express";
import { UpdateMetadataSchema } from "../../types";

import { userMiddleware } from "../../middleware/user";

export const userRouter = Router();
// it updates the metadata of the user
userRouter.post("/metadata", userMiddleware, async (req: Request, res: Response) => {
    const parsedData = UpdateMetadataSchema.safeParse(req.body)       
    if (!parsedData.success) {
        console.log("parsed data incorrect")
        res.status(400).json({message: "Validation failed"})
        return
    }
    try {
        await client.user.update({
            where: {
                id: req.userId
            },
            data: {
                avatarId: parsedData.data.avatarId
            }
        })
        res.json({message: "Metadata updated"})
    } catch(e) {
        console.log("error")
        res.status(400).json({message: "Internal server error"})
    }
})
// Clients would typically call this like GET /metadata/bulk?ids=[user1Id,user2Id].
// it fetches the  metadata (like avatar information) for multiple users in bulk.
userRouter.get("/metadata/bulk", async (req: Request, res: Response) => {
    // ?? "[]": This is the nullish coalescing operator.It allows you to provide a default value for a variable in case it is null or undefined.
    const userIdString = (req.query.ids ?? "[]") as string;
    const userIds = (userIdString).slice(1, userIdString?.length - 1).split(","); //This removes the opening [ and closing ] characters from the userIdString.
    // console.log(userIds)
    const metadata = await client.user.findMany({
        //Where clauses are used to filter records in the database. They are similar to SQL WHERE clauses.
        // id: { in: userIds }: This is a powerful Prisma filter. 
        // It tells the database to find all User records where the id field is present within the userIds array. 
        // This is equivalent to a SQL WHERE id IN ('id1', 'id2', 'id3').
        where: {
            id: {
                in: userIds
            }
        }, select: {
            avatar: true,
            id: true
        }
    })

    res.json({
        avatars: metadata.map((m: any) => ({
            userId: m.id,
            avatarId: m.avatar?.imageUrl
        }))
    })
})