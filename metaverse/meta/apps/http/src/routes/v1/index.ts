import { Router } from "express";
import { Request, Response } from "express";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { adminRouter } from "./admin";
import { SigninSchema, SignupSchema } from "../../types";
import {hash, compare} from "../../scrypt";
import client from "@repo/db";
import jwt from "jsonwebtoken";
const JWT_PASSWORD = process.env.JWT_PASSWORD || "123kasdk123";

export const router = Router();

router.post("/signup", async (req:  Request, res: Response) => {
    // console.log("inside signup")
    // check the user body me pass hoga isliye req.body kiya hai
    const parsedData = SignupSchema.safeParse(req.body)
    //if the parsed data is not successful, it means the data is not valid
    if (!parsedData.success) {
        console.log("parsed data incorrect")
        res.status(400).json({message: "Validation failed"})
        return
    }

    const hashedPassword = await hash(parsedData.data.password)

    try {
        //prisma.user: Exposes CRUD operations for the User model in this case client.user
        //Database me user table me store hoga parshed data
         const user = await client.user.create({
            data: {
                username: parsedData.data.username,
                password: hashedPassword,
                role: parsedData.data.type === "admin" ? "Admin" : "User",
            }
        })
        res.json({
            userId: user.id
        })
    } catch(e: any) {
        // console.log("erroer thrown")
        // console.log(e)
        res.status(400).json({message: "User already exists"})
    }
})

router.post("/signin", async (req: Request, res: Response) => {
    const parsedData = SigninSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.status(403).json({message: "Validation failed"})
        return
    }

    try {
        //.findUnique(): This is a method on the user model that attempts to find a single record in the User table based on a unique identifier.
        const user = await client.user.findUnique({
            where: {
                username: parsedData.data.username
            }
        })
        
        if (!user) {
            res.status(403).json({message: "User not found"})
            return
        }
        const isValid = await compare(parsedData.data.password, user.password)

        if (!isValid) {
            res.status(403).json({message: "Invalid password"})
            return
        }

        const token = jwt.sign({
            userId: user.id,
            role: user.role
        }, JWT_PASSWORD);

        res.json({
            userId: user.id,
            username: user.username,
            avatarId: user.avatarId,
            token
        })
    } catch(e) {
        res.status(400).json({message: "Internal server error"})
    }
})
// it fetches all the elements from the database
router.get("/elements", async (req, res) => {
    //.findMany(): When called without any where clause (as it is here), it fetches all records from the element table/collection in your database.
    const elements = await client.element.findMany()
//elements.map(e => ({ ... })): This is a standard JavaScript array method. 
// It iterates over each element record (e) retrieved from the database. For each e, it creates a new JavaScript object.
    res.json({elements: elements.map((e: any) => ({
        id: e.id,
        imageUrl: e.imageUrl,
        width: e.width,
        height: e.height,
        static: e.static
    }))})
})
// it fetches all the avatars from the database
router.get("/avatars", async (req: Request, res: Response) => {
    const avatars = await client.avatar.findMany()
    res.json({avatars: avatars.map((x: any) => ({
        id: x.id,
        imageUrl: x.imageUrl,
        name: x.name
    }))})
})

router.use("/user", userRouter)
router.use("/space", spaceRouter)
router.use("/admin", adminRouter)