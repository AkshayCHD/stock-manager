import mongoose from "../providers/Database";

export interface IUser {
  mobile: string;
  userName: string;
  lastSeen: Date;
}

// Create the model schema & register your custom methods here
export interface IUserModel extends IUser, mongoose.Document {}

// Define the User Schema
export const UserSchema = new mongoose.Schema(
  {
    mobile: { type: Number, unique: true },
    userName: { type: String, unique: true },
    lastSeen: { type: Date, default: Date.now() },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUserModel>("User", UserSchema);

export default User;
