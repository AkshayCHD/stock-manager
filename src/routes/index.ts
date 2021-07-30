import { Router } from "express";

import userRoutes from "./user.route";
import transactionRoutes from "./transaction.route";
import securityRoutes from "./security.route";

const router = Router();

router.use("/user", userRoutes);
router.use("/transaction", transactionRoutes);
router.use("/security", securityRoutes);

export default router;
