import { Router } from "express";
import {getAllCryptosController} from "../controllers/cryptos.controller.js";

const router = Router();

//GET/cryptos
router.get("/", getAllCryptosController);

export default router;