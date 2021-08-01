import { Router } from "express";
import { body, param } from "express-validator";
import { currentPriceError, tickerError } from "../constants/security.contant";
import securityController from "../controllers/security.controller";
const router = Router();

router.post(
  "/",
  body("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  body(
    "totalShares",
    "total shares shoule be an integer between 10 to 100000"
  ).isInt({ min: 10, max: 100000 }),
  body("currentPrice", currentPriceError).isFloat({ min: 1, max: 100000 }),
  securityController.createSecurity
);

router.delete(
  "/:ticker",
  param("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  securityController.deleteSecurity
);

router.put(
  "/:ticker",
  param("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  body("currentPrice", currentPriceError).isFloat({ min: 1, max: 100000 }),
  securityController.updateCurrentPrice
);

router.get("/", securityController.getSecurities);

export default router;
