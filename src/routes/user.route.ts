import { Router } from "express";
import { body } from "express-validator";
import userController from "../controllers/user.controller";
const router = Router();

router.post("/health-check", userController.healthCheck);
router.post(
  "/user",
  body("mobile").isNumeric().isLength({ min: 10, max: 10 }),
  body("userName").optional(),
  userController.createUser
);

export default router;
