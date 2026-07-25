import { Router } from "express";
import { userMiddleware } from "../../middleware/user";
import { updateMetadataHandler, getBulkMetadataHandler } from "./user.controller";

const router: Router = Router();

router.post("/metadata", userMiddleware, updateMetadataHandler);
router.get("/metadata/bulk", getBulkMetadataHandler);

export default router;
