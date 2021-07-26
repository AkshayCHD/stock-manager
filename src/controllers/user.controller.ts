import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

class UserController {
  public healthCheck(req: Request, res: Response, next: NextFunction) {
    return res.json({ status: "server up and running" });
  }
  public createUser(request: Request, response: Response, next: NextFunction) {
    try {
      const errors = validationResult(request);
      if (!errors.isEmpty()) {
        return response.status(400).json({ errors: errors.array() });
      }
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
