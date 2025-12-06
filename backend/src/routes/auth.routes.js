import { Router } from "express";
import {registerController, loginController, meController,
        resetPasswordController,updatePasswordController
        } from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/me", meController);
router.post("/reset-password", resetPasswordController);
router.post("/update-password", updatePasswordController);


export default router;
