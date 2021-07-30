import { Schema } from "mongoose";
import mongoose from "../providers/Database";

type TransactionType = "BUY" | "SELL";

export interface ITransaction {
  ticker: string;
  user: string;
  type: TransactionType;
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
    shareCount: { type: Number, default: 0, required: true },
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
