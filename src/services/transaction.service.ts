import APIError from "../exeption/APIError";
import Transaction, { ITransactionModel } from "../models/transaction.model";

class TransactionService {
  public static async calculateHoldings(userId: string, skipId: string) {
    let averagePrice = 0;
    let totalReturns = 0;
    let shareCount = 0;
    const transactions = await Transaction.find({ user: userId }).sort({
      createdAt: 1,
    });
    transactions.forEach((transaction) => {
      if (transaction._id.toString() === skipId.toString()) {
        return;
      }
      if (transaction.type === "BUY") {
        // calculate the new average price based on the number of shares and exchangePrice of transaction
        // newAveragePrice = (currentShares * currentPrice + newShares * newPrice) / (currentShares + newShares)
        averagePrice =
          (shareCount * averagePrice +
            transaction.shareCount * transaction.exchangePrice) /
          (shareCount + transaction.shareCount);
        shareCount += transaction.shareCount;
      } else {
        if (shareCount < transaction.shareCount) {
          throw new APIError("Invalid transaction Set", 400);
        }
        // calculate returns based on current average price, and the price at which transaction was recorded
        // returns = currentReturns + (currentPrice - averagePrice) * shareCount
        totalReturns +=
          (transaction.exchangePrice - averagePrice) * transaction.shareCount;
        shareCount -= transaction.shareCount;
      }
    });
    return { averagePrice, totalReturns, shareCount };
  }
}

export default TransactionService;
