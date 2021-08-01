import { Router } from "express";
import { body } from "express-validator";
import userController from "../controllers/user.controller";
const router = Router();

router.post("/health-check", userController.healthCheck);
router.post(
  "/",
  body("mobile", "mobile number must be a 10 digit number")
    .isNumeric()
    .isLength({ min: 10, max: 10 }),
  body("userName").optional(),
  userController.createUser
);

router.put(
  "/topup",
  body("funds", "funds must be an integer between 1 to 100000").isInt({
    min: 1,
    max: 100000,
  }),
  userController.topUpUser
);

router.get("/", userController.getUser);

export default router;
