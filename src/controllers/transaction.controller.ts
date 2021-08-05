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
      // shares that we want to buy should be greater than shares available for sale
      if (shareCount > security.sharesForSale) {
        throw new APIError(
          "Provided shareCount is not present for circulation",
          400
        );
      }
      const userId = request.user._id;
      let user = await User.findById(userId);
      // valid userId should be provided, inside token
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
      // user should have sufficient funds to buy shares
      if (user.funds < security.currentPrice * shareCount) {
        throw new APIError("Insufficient funds for the purchase", 400);
      }
      const transaction = await new Transaction({
        type: "BUY",
        shareCount: shareCount,
        ticker: security.ticker,
        user: user._id,
        exchangePrice: security.currentPrice,
        averagePrice: holding.averagePrice,
      }).save();
      try {
        const averagePrice =
          (holding.shareCount * holding.averagePrice +
            transaction.shareCount * transaction.exchangePrice) /
          (holding.shareCount + transaction.shareCount);
        await Holding.findByIdAndUpdate(holding._id, {
          $set: { averagePrice },
          $inc: { shareCount: transaction.shareCount },
        });
        await User.findByIdAndUpdate(userId, {
          $inc: {
            funds: -(transaction.shareCount * transaction.exchangePrice),
          },
        });
        await Security.findByIdAndUpdate(security._id, {
          $inc: { sharesForSale: -transaction.shareCount },
        });
      } catch (error) {
        // Revert transaction in case of a failure
        await Transaction.findByIdAndDelete(transaction._id);
        throw new APIError("Transaction coult not be processed", 400);
      }
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
      // valid security ticker should be provided
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
      // user should be holding some shares to sell
      if (!holding) {
        throw new APIError("User does not hold any shares to place order", 400);
      }
      // shares held by user should be greater than the amount that he is trying to sell
      if (holding.shareCount < shareCount) {
        throw new APIError(
          "User does not hold enough share to place order",
          400
        );
      }
      const transaction = await new Transaction({
        type: "SELL",
        shareCount: shareCount,
        ticker: security.ticker,
        user: user._id,
        exchangePrice: security.currentPrice,
        averagePrice: holding.averagePrice,
      }).save();
      try {
        const totalReturns =
          (transaction.exchangePrice - holding.averagePrice) *
          transaction.shareCount;
        await Holding.findByIdAndUpdate(holding._id, {
          $inc: { shareCount: -transaction.shareCount, totalReturns },
        });
        await User.findByIdAndUpdate(userId, {
          $inc: {
            funds: transaction.shareCount * transaction.exchangePrice,
          },
        });
        await Security.findByIdAndUpdate(security._id, {
          $inc: { sharesForSale: transaction.shareCount },
        });
      } catch (error) {
        // revert transaction incase of failure
        await Transaction.findByIdAndDelete(transaction._id);
        throw new APIError("Transaction coult not be processed", 400);
      }
      response.json({
        message: "Shares sold successfully",
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
      const transaction = await Transaction.findById(transactionId);
      // transaction mongo Id should be valid
      if (!transaction) {
        throw new APIError("Invalid transaction Id provided", 400);
      }
      // transaction should belong to the user calling this api
      if (transaction.user.toString() !== userId) {
        throw new APIError("Transaction does not belong to user", 400);
      }
      const security = await Security.findOne({ ticker: transaction.ticker });
      // security ticker should be valid
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
      // holding object of user with the following share should exist even if it contains zero shares
      if (!holding) {
        throw new APIError("No holding present for the following ticker", 400);
      }
      try {
        let fundsChange = 0;
        let securityChange = 0;
        if (transaction.type === "BUY") {
          // if transaction to be deleted was of type BUY then after deleting it users funds should
          // increase as, the amount used in buying is not not used
          fundsChange = transaction.shareCount * transaction.exchangePrice;
          securityChange = transaction.shareCount;
        } else {
          // if transaction to be deleted was of type SELL then after deleting it users funds should
          // decrease as, the amount received in selling is not received now
          fundsChange = -(transaction.shareCount * transaction.exchangePrice);
          securityChange = -transaction.shareCount;
        }
        await User.findByIdAndUpdate(userId, {
          $inc: {
            funds: fundsChange,
          },
        });
        const { averagePrice, totalReturns, shareCount } =
          await TransactionService.calculateHoldings(userId, transaction._id);
        await Holding.findByIdAndUpdate(holding._id, {
          $set: { averagePrice, shareCount, totalReturns },
        });
        await Security.findByIdAndUpdate(security._id, {
          $inc: { sharesForSale: securityChange },
        });
      } catch (error) {
        throw new APIError("Transaction coult not be processed", 400);
      }
      // delete transaction after all fields are updated correctly
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
      // transactionId should be a valid mongo Id
      if (!transaction) {
        throw new APIError("Invalid transaction Id provided", 400);
      }
      // transaction to be deleted should belong to the user
      if (transaction.user.toString() !== userId) {
        throw new APIError("Transaction does not belong to user", 400);
      }
      let security = await Security.findOne({ ticker: transaction.ticker });
      // security ticker should be valid
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
      let prevShareCount = transaction.shareCount,
        prevType = transaction.type;
      // update transaction fields if new fields are provided in put request
      if (shareCount) {
        transaction.shareCount = shareCount;
      }
      if (type) {
        transaction.type = type;
      }
      await transaction.save();
      if (transaction.type === "BUY") {
        // validation check for user funds availability as per updated shareCount
        if (
          user.funds <
          (transaction.shareCount - prevShareCount) * transaction.exchangePrice
        ) {
          throw new APIError(
            "Insufficient funds to apply this transaction",
            400
          );
        }
      }
      try {
        let fundsChange = 0;
        let securityChange = 0;
        // determine change in user funds depending on previous and current transaction types
        if (transaction.type === "BUY" && prevType === "BUY") {
          fundsChange =
            -(transaction.shareCount - prevShareCount) *
            transaction.exchangePrice;
          securityChange = -(transaction.shareCount - prevShareCount);
        } else if (transaction.type === "BUY" && prevType === "SELL") {
          fundsChange =
            -(transaction.shareCount + prevShareCount) *
            transaction.exchangePrice;
          securityChange = -(transaction.shareCount + prevShareCount);
        } else if (transaction.type === "SELL" && prevType === "SELL") {
          fundsChange =
            (transaction.shareCount - prevShareCount) *
            transaction.exchangePrice;

          securityChange = transaction.shareCount - prevShareCount;
        } else {
          fundsChange =
            (transaction.shareCount + prevShareCount) *
            transaction.exchangePrice;

          securityChange = transaction.shareCount + prevShareCount;
        }
        await User.findByIdAndUpdate(userId, {
          $inc: {
            funds: fundsChange,
          },
        });
        const { averagePrice, totalReturns, shareCount } =
          await TransactionService.calculateHoldings(userId, "");
        await Holding.findByIdAndUpdate(holding._id, {
          $set: { averagePrice, shareCount, totalReturns },
        });
        await Security.findByIdAndUpdate(security._id, {
          $inc: { sharesForSale: securityChange },
        });
      } catch (error) {
        await Transaction.findByIdAndUpdate(transaction._id, {
          $set: { type: prevType, shareCount: prevShareCount },
        });
        throw new APIError("Transaction coult not be processed", 400);
      }
      await transaction.save();
      response.json({
        message: "Transaction Updated Successfully",
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
        message: "Transactions fetched Successfully",
        transactions: transactions,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new TransactionController();
