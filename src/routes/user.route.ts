import { Router } from "express";
import { body } from "express-validator";
import userController from "../controllers/user.controller";
const router = Router();

router.post("/health-check", userController.healthCheck);
router.post(
  "/",
  body("mobile").isNumeric().isLength({ min: 10, max: 10 }),
  body("userName").optional(),
  userController.createUser
);

router.put(
  "/topup",
  body("funds").isInt({ min: 1, max: 100000 }),
  userController.topUpUser
);

export default router;
