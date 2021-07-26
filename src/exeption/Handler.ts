import { NextFunction, Request, Response } from "express";
// import Log from "../middlewares/Log";
import Locals from "../providers/Locals";

class Handler {
  /**
   * Show undermaintenance page incase of errors
   */
  public static errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): any {
    // Log.error(err.stack);
    res.status(500);

    if (err.name && err.name === "UnauthorizedError") {
      const innerMessage =
        err.inner && err.inner.message ? err.inner.message : undefined;
      return res.json({
        error: ["Invalid Token!", innerMessage],
      });
    }

    return res.json({
      error: err,
    });
  }
}

export default Handler;
