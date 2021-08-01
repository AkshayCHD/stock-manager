import { Router } from "express";

import userRoutes from "./user.route";
import transactionRoutes from "./transaction.route";
import securityRoutes from "./security.route";
import holdingRoutes from "./holding.route";

const router = Router();

router.use("/user", userRoutes);
router.use("/transaction", transactionRoutes);
router.use("/security", securityRoutes);
router.use("/holding", holdingRoutes);

export default router;
