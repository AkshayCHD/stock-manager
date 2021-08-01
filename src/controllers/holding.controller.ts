import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import APIError from "../exeption/APIError";
import ValidationError from "../exeption/ValidationError";
import Holding from "../models/holdings.model";
import Locals from "../providers/Locals";

class HoldingController {
  public getHoldings = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const userId = request.user._id;
      const holdings = await Holding.find({ user: userId }).limit(50).skip(0);
      response.json({
        message: "Holding fetched Successfully",
        holdings: holdings,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new HoldingController();
