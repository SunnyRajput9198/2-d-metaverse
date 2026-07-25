import { Router } from "express";
import authRoute from "../../modules/auth/auth.route";
import userRoute from "../../modules/user/user.route";
import spaceRoute from "../../modules/space/space.route";
import adminRoute from "../../modules/admin/admin.route";
import catalogRoute from "../../modules/catalog/catalog.route";
import livekitRouter from "./livekit";

export const router = Router();

// Mount Feature Module Routers
router.use("/", authRoute);
router.use("/", catalogRoute);
router.use("/user", userRoute);
router.use("/space", spaceRoute);
router.use("/admin", adminRoute);
router.use("/livekit", livekitRouter);