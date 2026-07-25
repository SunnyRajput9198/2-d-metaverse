import { Router } from "express";
import { adminMiddleware } from "../../middleware/admin";
import {
    createElementHandler,
    updateElementHandler,
    createAvatarHandler,
    createMapHandler,
} from "./admin.controller";

const router: Router = Router();

router.use(adminMiddleware);

router.post("/element", createElementHandler);
router.put("/element/:elementId", updateElementHandler);
router.post("/avatar", createAvatarHandler);
router.post("/map", createMapHandler);

export default router;
