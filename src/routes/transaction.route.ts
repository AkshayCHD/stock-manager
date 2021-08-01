import { Router } from "express";
import { body, param } from "express-validator";
import { tickerError } from "../constants/security.contant";
import { shareCountError } from "../constants/transaction.constant";
import transactionController from "../controllers/transaction.controller";
const router = Router();

router.post(
  "/buy/:ticker",
  param("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  body("shareCount", shareCountError).isInt({ min: 1, max: 100000 }),
  transactionController.buyShares
);

router.post(
  "/sell/:ticker",
  param("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  body("shareCount", shareCountError).isInt({ min: 0, max: 100000 }),
  transactionController.sellShares
);

router.delete(
  "/:transactionId",
  param("transactionId", "transactionId is required").isString(),
  transactionController.deleteTransaction
);

router.put(
  "/:transactionId",
  param("transactionId", "transactionId is required").isString(),
  body("shareCount", shareCountError).optional().isInt({ min: 0, max: 100000 }),
  body("type", "type can be one out of BUY and SELL")
    .optional()
    .isIn(["BUY", "SELL"]),
  transactionController.updateTransaction
);

router.get(
  "/:ticker",
  param("ticker", tickerError).isString().isLength({ min: 3, max: 10 }),
  transactionController.getTransactionsByTicker
);

router.get("/", transactionController.getTransactions);

export default router;
