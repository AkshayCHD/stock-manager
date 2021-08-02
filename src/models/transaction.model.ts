import { Schema } from "mongoose";
import mongoose from "../providers/Database";

type TransactionType = "BUY" | "SELL";

export interface ITransaction {
  ticker: string;
  user: string;
  type: TransactionType;
  exchangePrice: number;
  averagePrice: number;
  shareCount: number;
}

// Create the model schema & register your custom methods here
export interface ITransactionModel extends ITransaction, mongoose.Document {}

// Define the Transaction Schema
export const TransactionSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    ticker: { type: String, required: true },
    exchangePrice: { type: Number, min: 0, required: true },
    averagePrice: { type: Number, min: 0, required: true },
    shareCount: { type: Number, min: 0, default: 0, required: true },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model<ITransactionModel>(
  "Transaction",
  TransactionSchema
);

export default Transaction;
