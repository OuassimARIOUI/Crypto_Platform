import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
    registerController, loginController, meController,
    resetPasswordController, updatePasswordController, firebaseSyncController,
    loginFirebase,
    updateMeController
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/me", meController);

router.post("/update-password", updatePasswordController);
router.post("/firebase-sync", firebaseSyncController);
router.post("/firebase-login", loginFirebase);

router.patch("/me", auth, updateMeController);


export default router;
