import { Router } from "express";
import { userMiddleware } from "../../middleware/user";
import {
    createSpaceHandler,
    deleteSpaceElementHandler,
    deleteSpaceHandler,
    getUserSpacesHandler,
    addSpaceElementHandler,
    getSpaceByIdHandler,
} from "./space.controller";

const router: Router = Router();

router.post("/", userMiddleware, createSpaceHandler);
router.delete("/element", userMiddleware, deleteSpaceElementHandler);
router.delete("/:spaceId", userMiddleware, deleteSpaceHandler);
router.get("/all", userMiddleware, getUserSpacesHandler);
router.post("/element", userMiddleware, addSpaceElementHandler);
router.get("/:spaceId", getSpaceByIdHandler);

export default router;
