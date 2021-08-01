import mongoose from "../providers/Database";

export interface ISecurity {
  ticker: string;
  totalShares: number;
  currentPrice: number;
  sharesForSale: number;
}

// Create the model schema & register your custom methods here
export interface ISecurityModel extends ISecurity, mongoose.Document {}

// Define the Security Schema
export const SecuritySchema = new mongoose.Schema(
  {
    ticker: { type: String, unique: true, index: true, required: true },
    totalShares: { type: Number, min: 0, required: true },
    sharesForSale: { type: Number, min: 0, required: true },
    currentPrice: { type: Number, min: 0, required: true },
  },
  {
    timestamps: true,
  }
);

const Security = mongoose.model<ISecurityModel>("Security", SecuritySchema);

export default Security;
