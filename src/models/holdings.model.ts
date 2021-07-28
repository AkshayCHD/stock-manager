import { Schema } from "mongoose";
import mongoose from "../providers/Database";

type HoldingType = "holding" | "godHolding";

export interface IHolding {
  userId: string;
  securityIdentifier: string;
  shareCount: number;
  averagePrice: number;
}

// Create the model schema & register your custom methods here
export interface IHoldingModel extends IHolding, mongoose.Document {}

// Define the Holding Schema
export const HoldingSchema = new mongoose.Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    securityIdentifier: { type: String, required: true },
    averagePrice: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Holding = mongoose.model<IHoldingModel>("Holding", HoldingSchema);

export default Holding;
