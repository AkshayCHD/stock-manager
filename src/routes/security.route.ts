import { Router } from "express";
import { body, param } from "express-validator";
import userController from "../controllers/security.controller";
const router = Router();

router.post(
  "/",
  body("ticker").isString().isLength({ min: 3, max: 10 }),
  body("totalShares").isInt({ min: 10, max: 100000 }),
  body("currentPrice").isInt({ min: 1, max: 100000 }),
  userController.createSecurity
);

router.delete(
  "/",
  param("ticker").isString().isLength({ min: 3, max: 10 }),
  userController.deleteSecurity
);

export default router;
