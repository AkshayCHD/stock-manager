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
  /**
   * @param  {Date} lockedTill
   * @description validation condition for unlocking resource
   */
  private unlockResource(lockedTill: Date) {
    const todaysDate = new Date();
    if (todaysDate.getTime() > lockedTill.getTime()) {
      return true;
    }
    return false;
  }
  /**
   * @param  {IUserModel} user
   * @returns Promise
   * @description make locked funds active after lockin period ends
   */
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
  /**
   * @param  {IHoldingModel} holding
   * @returns Promise
   * @description make locked shares active after lockin period ends
   */
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
  /**
   * @param  {Request} request
   * @param  {Response} response
   * @param  {NextFunction} next
   * @description controller function for buy share transactions
   */
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
      response.json({
        message: "Shares purchased successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  };
  /**
   * @param  {Request} request
   * @param  {Response} response
   * @param  {NextFunction} next
   * @description controller function for invoking sell share transaction
   */
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
      await TransactionService.applyTransaction(
        user,
        holding,
        security,
        transaction
      );
      await transaction.save();
      response.json({
        message: "Shares purchased successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @param  {Request} request
   * @param  {Response} response
   * @param  {NextFunction} next
   * @description controller function for deleting buy/sell transactions
   */
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

      response.json({
        message: "Transaction Deleted Successfully",
        transaction: transaction,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * @param  {Request} request
   * @param  {Response} response
   * @param  {NextFunction} next
   * @description controller function for updating buy and sell transaction
   */
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

  public getTransactions = async (
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
      const transactions = await Transaction.find({ user: userId })
        .limit(50)
        .skip(0);
      response.json({
        message: "Transaction fetched Successfully",
        transactions: transactions,
      });
    } catch (error) {
      next(error);
    }
  };

  public getTransactionsByTicker = async (
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
      const { ticker } = request.params;
      const transactions = await Transaction.find({
        user: userId,
        ticker: ticker,
      })
        .limit(50)
        .skip(0);
      response.json({
        message: "Transaction fetched Successfully",
        transactions: transactions,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new TransactionController();
