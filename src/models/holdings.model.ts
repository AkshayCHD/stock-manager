import { Schema } from "mongoose";
import mongoose from "../providers/Database";

export interface IHolding {
  user: string;
  ticker: string;
  shareCount: number;
  averagePrice: number;
  totalReturns: number;
}

// Create the model schema & register your custom methods here
export interface IHoldingModel extends IHolding, mongoose.Document {}

// Define the Holding Schema
export const HoldingSchema = new mongoose.Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ticker: { type: String, required: true },
    averagePrice: { type: Number, min: 0, default: 0 },
    totalReturns: { type: Number, default: 0 },
    shareCount: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Holding = mongoose.model<IHoldingModel>("Holding", HoldingSchema);

export default Holding;
