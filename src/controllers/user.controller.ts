import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import APIError from "../exeption/APIError";
import ValidationError from "../exeption/ValidationError";
import User from "../models/user.model";
import Locals from "../providers/Locals";

class UserController {
  public healthCheck(req: Request, res: Response, next: NextFunction) {
    return res.json({ status: "server up and running" });
  }
  public async createUser(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const { mobile } = request.body;
      let user = await User.findOne({ mobile: mobile });
      if (!user) {
        user = await new User({
          mobile,
          userName: mobile,
        }).save();
      }
      var token = jwt.sign({ _id: user._id }, Locals.config().appSecret);
      response.json({ message: "Successfully logged in", token: token });
    } catch (error) {
      next(error);
    }
  }
  public async topUpUser(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const { funds } = request.body;
      const userId = request.user._id;
      let user = await User.findById(userId);
      if (!user) {
        throw new APIError("Invalid user id provided", 400);
      }
      await User.findByIdAndUpdate(userId, { $inc: { funds: funds } });
      response.json({ message: "Funds added successfully" });
    } catch (error) {
      next(error);
    }
  }
  public async getUser(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const userId = request.user._id;
      let user = await User.findById(userId);
      if (!user) {
        throw new APIError("Invalid user id provided", 400);
      }
      response.json({ message: "User fetched successfully", user: user });
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
