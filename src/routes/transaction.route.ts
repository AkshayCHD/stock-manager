import { Router } from "express";
import { body, param } from "express-validator";
import transactionController from "../controllers/transaction.controller";
const router = Router();

router.post(
  "/buy/:ticker",
  param("ticker", "ticker should be a string of length between 3 - 10")
    .isString()
    .isLength({ min: 3, max: 10 }),
  body("shareCount").isInt({ min: 1, max: 100000 }),
  transactionController.buyShares
);

router.post(
  "/sell/:ticker",
  param("ticker", "ticker should be a string of length between 3 - 10")
    .isString()
    .isLength({ min: 3, max: 10 }),
  body("shareCount").isInt({ min: 0, max: 100000 }),
  transactionController.sellShares
);

export default router;
