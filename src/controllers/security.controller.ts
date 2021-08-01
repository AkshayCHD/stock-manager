import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import APIError from "../exeption/APIError";
import ValidationError from "../exeption/ValidationError";
import Holding from "../models/holdings.model";
import Security from "../models/security.model";
import User from "../models/user.model";

class SecurityController {
  public async createSecurity(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      console.log(request.body);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const { ticker, totalShares, currentPrice } = request.body;
      const security = await new Security({
        ticker: ticker,
        totalShares,
        sharesForSale: totalShares,
        currentPrice: currentPrice,
      }).save();
      response.send({
        security: security,
        message: "Security created successfully",
      });
    } catch (error) {
      next(error);
    }
  }
  public async deleteSecurity(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const { ticker } = request.params;
      const security = await Security.findOne({ ticker: ticker });

      if (!security) {
        throw new APIError("Invalid ticker symbol provided", 400);
      }
      const holdings = await Holding.find({ ticker: security.ticker });
      await Promise.all(
        holdings.map(async (holding) => {
          const profit =
            (security.currentPrice - holding.averagePrice) * holding.shareCount;
          const soldFor = security.currentPrice * holding.shareCount;
          await User.findByIdAndUpdate(holding.user, {
            $inc: { funds: soldFor, totalReturns: profit },
          });
          await Holding.findByIdAndDelete(holding._id);
        })
      );
      response.json({
        security: security,
        message: "Security Deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
  public async updateCurrentPrice(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors, 400);
      }
      const { ticker } = request.params;
      const { currentPrice } = request.body;
      const security = await Security.findOne({ ticker: ticker });

      if (!security) {
        throw new APIError("Invalid ticker symbol provided", 400);
      }
      await Security.findByIdAndUpdate(security._id, {
        $set: { currentPrice: currentPrice },
      });
      response.json({
        security: security,
        message: "Price updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  public getSecurities = async (
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
      const securities = await Security.find().limit(50).skip(0);
      response.json({
        message: "Security fetched Successfully",
        securities: securities,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new SecurityController();
