import { Router } from "express";
import {registerController, loginController, meController} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/me", meController);

export default router;
