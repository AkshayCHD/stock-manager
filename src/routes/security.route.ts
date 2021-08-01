import { Router } from "express";
import { body, param } from "express-validator";
import { currentPriceError, tickerError } from "../constants/security.contant";
import userController from "../controllers/security.controller";
const router = Router();

router.post(
  "/",
  body("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  body("totalShares").isInt({ min: 10, max: 100000 }),
  body("currentPrice", currentPriceError).isInt({ min: 1, max: 100000 }),
  userController.createSecurity
);

router.delete(
  "/:ticker",
  param("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  userController.deleteSecurity
);

router.put(
  "/:ticker",
  param("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  body("currentPrice", currentPriceError).isInt({ min: 1, max: 100000 }),
  userController.updateCurrentPrice
);

export default router;
