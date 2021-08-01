import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import APIError from "../exeption/APIError";
import ValidationError from "../exeption/ValidationError";
import Holding, { IHolding, IHoldingModel } from "../models/holdings.model";
import Security from "../models/security.model";
import Transaction from "../models/transaction.model";
import User, { IUserModel } from "../models/user.model";
import TransactionService from "../services/transaction.service";

class TransactionController {
  public healthCheck(req: Request, res: Response, next: NextFunction) {
    return res.json({ status: "server up and running" });
  }
  private unlockResource(lockedTill: Date) {
    const todaysDate = new Date();
    console.log(todaysDate.getTime());
    console.log(lockedTill.getTime());
    if (todaysDate.getTime() > lockedTill.getTime()) {
      return true;
    }
    return false;
  }
  private unlockPotentialFunds = async (
    user: IUserModel
  ): Promise<IUserModel> => {
    if (this.unlockResource(user.lockedTill)) {
      user.funds += user.lockedFunds;
      user.lockedFunds = 0;
      await user.save();
    }
    return user;
  };
  private unlockPotentialShares = async (
    holding: IHoldingModel
  ): Promise<IHoldingModel> => {
    if (this.unlockResource(holding.lockedTill)) {
      holding.shareCount += holding.lockedShares;
      holding.lockedShares = 0;
      await holding.save();
    }
    return holding;
  };
  public buyShares = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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
      let user = await User.findById(userId);
      if (!user) {
        throw new APIError("Invalid User id", 400);
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
      user = await this.unlockPotentialFunds(user);
      holding = await this.unlockPotentialShares(holding);
      if (user.funds < security.currentPrice * shareCount) {
        throw new APIError("Insufficient funds for the purchase", 400);
      }
      const transaction = new Transaction({
        type: "BUY",
        shareCount: shareCount,
        ticker: security.ticker,
        user: user._id,
        exchangePrice: security.currentPrice,
        averagePrice: holding.averagePrice,
        unlockedTill: TransactionService.getLockedTillDate(),
      });
      await TransactionService.applyTransaction(
        user,
        holding,
        security,
        transaction
      );
      await transaction.save();
      // const currentShareCount = holding.shareCount;
      // const currentAveragePrice = holding.averagePrice;
      // const sharesToBuy = shareCount;
      // const newAveragePrice =
      //   (currentShareCount * currentAveragePrice +
      //     sharesToBuy * security.currentPrice) /
      //   (sharesToBuy + currentShareCount);
      // await Holding.findByIdAndUpdate(holding._id, {
      //   $inc: { shareCount: shareCount },
      //   $set: { averagePrice: newAveragePrice },
      // });
      // await User.findByIdAndUpdate(userId, {
      //   $inc: { funds: -(sharesToBuy * security.currentPrice) },
      // });
      // const transaction = await new Transaction({
      //   user: userId,
      //   ticker: security.ticker,
      //   type: "BUY",
      //   exchangePrice: security.currentPrice,
      //   shareCount: shareCount,
      // }).save();
      response.json({
        message: "Shares purchased successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  public sellShares = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
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
      let user = await User.findById(userId);
      if (!user) {
        throw new APIError("Invalid User id", 400);
      }
      let holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      if (!holding) {
        throw new APIError("User does not hold any shares to place order", 400);
      }
      user = await this.unlockPotentialFunds(user);
      holding = await this.unlockPotentialShares(holding);
      if (holding.shareCount < shareCount) {
        throw new APIError(
          "User does not hold enough share to place order",
          400
        );
      }
      const transaction = new Transaction({
        type: "SELL",
        shareCount: shareCount,
        ticker: security.ticker,
        user: user._id,
        exchangePrice: security.currentPrice,
        averagePrice: holding.averagePrice,
        unlockedTill: TransactionService.getLockedTillDate(),
      });
      console.log("selling");
      console.log(shareCount);
      await TransactionService.applyTransaction(
        user,
        holding,
        security,
        transaction
      );
      await transaction.save();
      // const profit =
      //   (security.currentPrice - holding.averagePrice) * shareCount;
      // const soldFor = security.currentPrice * shareCount;
      // await User.findByIdAndUpdate(userId, {
      //   $inc: { funds: soldFor, totalReturns: profit },
      // });
      // await Holding.findByIdAndUpdate(holding._id, {
      //   $inc: { shareCount: -shareCount },
      // });
      // const transaction = await new Transaction({
      //   user: userId,
      //   ticker: security.ticker,
      //   type: "SELL",
      //   exchangePrice: security.currentPrice,
      //   shareCount: shareCount,
      // }).save();
      response.json({
        message: "Shares purchased successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  public deleteTransaction = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const userId = request.user._id;
      const { transactionId } = request.params;
      const { shareCount } = request.body;
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new APIError("Invalid transaction Id provided", 400);
      }
      if (transaction.user.toString() !== userId) {
        throw new APIError("Transaction does not belong to user", 400);
      }
      const security = await Security.findOne({ ticker: transaction.ticker });
      if (!security) {
        throw new APIError("No security found with provided id", 400);
      }
      const user = await User.findById(userId);
      if (!user) {
        throw new APIError("No user found with provided id", 400);
      }
      const holding = await Holding.findOne({
        user: userId,
        ticker: transaction.ticker,
      });
      if (!holding) {
        throw new APIError("No holding present for the following ticker", 400);
      }
      await TransactionService.revertTransaction(
        user,
        holding,
        security,
        transaction
      );
      await Transaction.findByIdAndDelete(transaction._id);

      // if (transaction.type === "BUY") {
      //   const currentShares = holding.shareCount;
      //   const transactionShares = transaction.shareCount;
      //   const currentAveragePrice = holding.averagePrice;
      //   const transactionPrice = transaction.exchangePrice;
      //   const oldAveragePrice =
      //     (currentAveragePrice * currentShares -
      //       transactionShares * transactionPrice) /
      //     (currentShares - transactionShares);
      //   await Holding.findByIdAndUpdate(holding._id, {
      //     $set: { averagePrice: oldAveragePrice },
      //   });
      //   await User.findByIdAndUpdate(userId, {
      //     $inc: { funds: transactionPrice * transactionShares },
      //   });
      //   await Transaction.findByIdAndDelete(transactionId);
      // } else {
      //   const profitMade = transaction.exchangePrice - holding.averagePrice;
      //   await Holding.findByIdAndUpdate(holding._id, {
      //     $inc: { shareCount: transaction.shareCount },
      //   });
      //   await User.findByIdAndUpdate(userId, {
      //     $inc: {
      //       returns: -profitMade,
      //       fund: -(transaction.shareCount * transaction.exchangePrice),
      //     },
      //   });
      //   await Transaction.findByIdAndDelete(transactionId);
      // }
      response.json({
        message: "Transaction Deleted Successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  public updateTransaction = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const userId = request.user._id;
      const { transactionId } = request.params;
      const { shareCount, type } = request.body;
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        throw new APIError("Invalid transaction Id provided", 400);
      }
      if (transaction.user.toString() !== userId) {
        throw new APIError("Transaction does not belong to user", 400);
      }
      let security = await Security.findOne({ ticker: transaction.ticker });
      if (!security) {
        throw new APIError("No security found with provided id", 400);
      }
      let user = await User.findById(userId);
      if (!user) {
        throw new APIError("No user found with provided id", 400);
      }
      let holding = await Holding.findOne({
        user: userId,
        ticker: transaction.ticker,
      });
      if (!holding) {
        throw new APIError("No holding present for the following ticker", 400);
      }
      await TransactionService.revertTransaction(
        user,
        holding,
        security,
        transaction
      );
      if (shareCount) {
        transaction.shareCount = shareCount;
      }
      if (type) {
        transaction.type = type;
      }
      holding = await Holding.findById(holding._id);
      security = await Security.findById(security._id);
      user = await User.findById(user._id);
      if (!user || !security || !holding) {
        throw new APIError("Unusual deletion of entry", 400);
      }
      console.log("*****");
      console.log(holding);
      console.log("*****");
      if (transaction.type === "BUY") {
        if (user.funds < transaction.shareCount * transaction.exchangePrice) {
          throw new APIError(
            "Old transaction reverted but new transaction cannot be applied, due to lack of funds",
            400
          );
        } else {
          if (holding.shareCount < transaction.shareCount) {
            throw new APIError(
              "Old transaction reverted but new transaction cannot be applied, due to lack of shares",
              400
            );
          }
        }
      }
      await TransactionService.applyTransaction(
        user,
        holding,
        security,
        transaction
      );
      await transaction.save();
      response.json({
        message: "Transaction Deleted Successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new TransactionController();
