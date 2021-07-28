import mongoose from "../providers/Database";

type UserType = "user" | "godUser";

export interface IUser {
  mobile: string;
  totalReturns: number;
  userType: UserType;
  funds: number;
}

// Create the model schema & register your custom methods here
export interface IUserModel extends IUser, mongoose.Document {}

// Define the User Schema
export const UserSchema = new mongoose.Schema(
  {
    mobile: { type: Number, unique: true },
    userType: { type: String, enum: ['user', 'godUser'], default: "user" },
    totalReturns: { type: Number, default: 0 },
    funds: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUserModel>("User", UserSchema);

export default User;
