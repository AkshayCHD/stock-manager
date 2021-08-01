import transactionController from "../controllers/transaction.controller";
import APIError from "../exeption/APIError";
import Holding, { IHoldingModel } from "../models/holdings.model";
import Security, { ISecurityModel } from "../models/security.model";
import { ITransactionModel } from "../models/transaction.model";
import User, { IUserModel } from "../models/user.model";

class TransactionService {
  public static getLockedTillDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0);
    tomorrow.setMinutes(0);
    tomorrow.setSeconds(0);
    tomorrow.setMilliseconds(0);
    return tomorrow;
  }
  public static async applyTransaction(
    user: IUserModel,
    holding: IHoldingModel,
    security: ISecurityModel,
    transaction: ITransactionModel
  ) {
    if (transaction.type === "BUY") {
      if (user.funds < transaction.shareCount * transaction.exchangePrice) {
        throw new APIError("Not enough funds to perform transaction", 400);
      }
      const currentShareCount = holding.shareCount + holding.lockedShares;
      const currentAveragePrice = holding.averagePrice;
      const sharesToBuy = transaction.shareCount;
      const newAveragePrice =
        (currentShareCount * currentAveragePrice +
          sharesToBuy * transaction.exchangePrice) /
        (sharesToBuy + currentShareCount);
      await Holding.findByIdAndUpdate(holding._id, {
        $inc: { lockedShares: transaction.shareCount },
        $set: {
          averagePrice: newAveragePrice,
          lockedTill: this.getLockedTillDate(),
        },
      });
      await User.findByIdAndUpdate(user._id, {
        $inc: { funds: -(sharesToBuy * security.currentPrice) },
      });
      await Security.findByIdAndUpdate(security._id, {
        $inc: { sharesForSale: -transaction.shareCount },
      });
    } else {
      const profit =
        (transaction.exchangePrice - transaction.averagePrice) *
        transaction.shareCount;
      const soldFor = transaction.exchangePrice * transaction.shareCount;
      await User.findByIdAndUpdate(user._id, {
        $inc: {
          lockedFunds: soldFor,
          totalReturns: profit,
        },
        $set: {
          lockedTill: this.getLockedTillDate(),
        },
      });
      await Holding.findByIdAndUpdate(holding._id, {
        $inc: { shareCount: -transaction.shareCount },
      });
      await Security.findByIdAndUpdate(security._id, {
        $inc: { sharesForSale: transaction.shareCount },
      });
    }
  }
  public static async revertTransaction(
    user: IUserModel,
    holding: IHoldingModel,
    security: ISecurityModel,
    transaction: ITransactionModel
  ) {
    if (transaction.unlockedTill.getTime() < new Date().getTime()) {
      throw new APIError("Transaction locked, cannot revert now", 400);
    }
    if (transaction.type === "BUY") {
      const currentShares = holding.shareCount + holding.lockedShares;
      const transactionShares = transaction.shareCount;
      const currentAveragePrice = holding.averagePrice;
      const transactionPrice = transaction.exchangePrice;
      const oldAveragePrice =
        (currentAveragePrice * currentShares -
          transactionShares * transactionPrice) /
        (currentShares - transactionShares);
      console.log(currentShares);
      console.log(transactionShares);
      console.log(currentAveragePrice);
      console.log(transactionPrice);
      console.log(oldAveragePrice);
      await Holding.findByIdAndUpdate(holding._id, {
        $set: { averagePrice: oldAveragePrice },
        $inc: { lockedShares: -transaction.shareCount },
      });
      await User.findByIdAndUpdate(user._id, {
        $inc: { funds: transactionPrice * transactionShares },
      });
      await Security.findByIdAndUpdate(security._id, {
        $inc: { sharesForSale: transaction.shareCount },
      });
    } else {
      const profitMade =
        (transaction.exchangePrice - transaction.averagePrice) *
        transaction.shareCount;
      const currentSharesHeld = holding.shareCount + holding.lockedShares;
      const newAveragePrice =
        (transaction.shareCount * transaction.averagePrice +
          holding.averagePrice * currentSharesHeld) /
        (currentSharesHeld + transaction.shareCount);
      await Holding.findByIdAndUpdate(holding._id, {
        $inc: { shareCount: transaction.shareCount },
        $set: { averagePrice: newAveragePrice },
      });
      await User.findByIdAndUpdate(user._id, {
        $inc: {
          totalReturns: -profitMade,
          lockedFunds: -(transaction.shareCount * transaction.exchangePrice),
        },
      });
      await Security.findByIdAndUpdate(security._id, {
        $inc: { sharesForSale: -transaction.shareCount },
      });
    }
  }
}

export default TransactionService;
