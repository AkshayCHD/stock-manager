import express from "express";

import Locals from "./Locals";
import apiRouter from "../routes/index";
import ExceptionHandler from "../exeption/Handler";

class Express {
  /**
   * Create the express object
   */
  public express: express.Application;

  /**
   * Initializes the express server
   */
  constructor() {
    this.express = express();

    this.mountRoutes();
  }

  /**
   * Mounts all the defined routes
   */
  private mountRoutes(): void {
    const apiPrefix = Locals.config().apiPrefix;
    this.express.use(`/${apiPrefix}`, apiRouter);
  }

  /**
   * Starts the express server
   */
  public init(): any {
    const port: number = Locals.config().port;

    this.express.use(ExceptionHandler.errorHandler);

    // Start the server on the specified port
    this.express.listen(port, () => {
      return console.log(
        "\x1b[33m%s\x1b[0m",
        `Server :: Running @ 'http://localhost:${port}'`
      );
    });
  }
}

/** Export the express module */
export default new Express();
