import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
    registerController, loginController, meController,
    resetPasswordController, updatePasswordController, firebaseSyncController,
    loginFirebase,
    updateMeController,
    pseudoAvailabilityController
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", registerController);
router.get("/pseudo/check", pseudoAvailabilityController);
router.post("/login", loginController);
router.get("/me", meController);

router.post("/reset-password", resetPasswordController);

router.post("/update-password", updatePasswordController);
router.post("/firebase-sync", firebaseSyncController);
router.post("/firebase-login", loginFirebase);

router.patch("/me", auth, updateMeController);


export default router;
