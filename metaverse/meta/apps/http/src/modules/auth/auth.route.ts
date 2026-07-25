import { Router } from "express";
import { signupHandler, signinHandler } from "./auth.controller";

const router: Router = Router();

router.post("/signup", signupHandler);
router.post("/signin", signinHandler);

export default router;
