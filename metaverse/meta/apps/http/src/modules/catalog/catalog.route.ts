import { Router } from "express";
import { getElementsHandler, getAvatarsHandler } from "./catalog.controller";

const router: Router = Router();

router.get("/elements", getElementsHandler);
router.get("/avatars", getAvatarsHandler);

export default router;
