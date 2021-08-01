import { Router } from "express";
import { body } from "express-validator";
import holdingController from "../controllers/holding.controller";
const router = Router();

router.get("/", holdingController.getHoldings);
export default router;
