import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import APIError from "../exeption/APIError";
import ValidationError from "../exeption/ValidationError";
import Holding from "../models/holdings.model";
import Security from "../models/security.model";
import Transaction from "../models/transaction.model";
import User from "../models/user.model";

class TransactionController {
  public healthCheck(req: Request, res: Response, next: NextFunction) {
    return res.json({ status: "server up and running" });
  }
  public async buyShares(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const { ticker } = request.params;
      const { shareCount } = request.body;
      const security = await Security.findOne({ ticker: ticker });
      if (!security) {
        throw new APIError("Invalid Security ticker provided", 400);
      }
      if (shareCount > security.sharesForSale) {
        throw new APIError(
          "Provided shareCount is not present for circulation",
          400
        );
      }
      const userId = request.user._id;
      const user = await User.findById(userId);
      if (!user) {
        throw new APIError("Invalid User id", 400);
      }
      if (user.funds < security.currentPrice * shareCount) {
        throw new APIError("Insufficient funds for the purchase", 400);
      }
      let holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      if (!holding) {
        holding = await new Holding({
          user: userId,
          ticker: security.ticker,
          shareCount: 0,
          averagePrice: 0,
        }).save();
      }
      const currentShareCount = holding.shareCount;
      const currentAveragePrice = holding.averagePrice;
      const sharesToBuy = shareCount;
      const newAveragePrice =
        (currentShareCount * currentAveragePrice +
          sharesToBuy * security.currentPrice) /
        (sharesToBuy + currentShareCount);
      await Holding.findByIdAndUpdate(holding._id, {
        $inc: { shareCount: shareCount },
        $set: { averagePrice: newAveragePrice },
      });
      await User.findByIdAndUpdate(userId, {
        $inc: { funds: -(sharesToBuy * security.currentPrice) },
      });
      const transaction = await new Transaction({
        user: userId,
        ticker: security.ticker,
        type: "BUY",
        shareCount: shareCount,
      }).save();
      response.json({
        message: "Shares purchased successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  }

  public async sellShares(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const { ticker } = request.params;
      const { shareCount } = request.body;
      const security = await Security.findOne({ ticker: ticker });
      if (!security) {
        throw new APIError("Invalid Security ticker provided", 400);
      }
      const userId = request.user._id;
      const user = await User.findById(userId);
      if (!user) {
        throw new APIError("Invalid User id", 400);
      }
      let holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      if (!holding || holding.shareCount < shareCount) {
        throw new APIError(
          "User does not hold enough shares to place order",
          400
        );
      }
      const profit =
        (security.currentPrice - holding.averagePrice) * shareCount;
      const soldFor = security.currentPrice * shareCount;
      await User.findByIdAndUpdate(userId, {
        $inc: { funds: soldFor, totalReturns: profit },
      });
      await Holding.findByIdAndUpdate(holding._id, {
        $inc: { shareCount: -shareCount },
      });
      const transaction = await new Transaction({
        user: userId,
        ticker: security.ticker,
        type: "SELL",
        shareCount: shareCount,
      }).save();
      response.json({
        message: "Shares purchased successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();
