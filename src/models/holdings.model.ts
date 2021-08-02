import { Schema } from "mongoose";
import mongoose from "../providers/Database";

type HoldingType = "holding" | "godHolding";

export interface IHolding {
  user: string;
  ticker: string;
  shareCount: number;
  averagePrice: number;
  totalReturns: number;
  lockedTill: Date;
  lockedShares: number;
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
    lockedTill: { type: Date, default: new Date("2020-01-01") },
    lockedShares: { type: Number, min: 0, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Holding = mongoose.model<IHoldingModel>("Holding", HoldingSchema);

export default Holding;
