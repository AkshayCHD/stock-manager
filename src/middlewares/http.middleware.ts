import cors from "cors";
import { Application } from "express";
import compress from "compression";
import expressValidator from "express-validator";

class Http {
  public static mount(_express: Application): Application {
    console.log("Booting the 'HTTP' middleware...");

    // Disable the x-powered-by header in response
    _express.disable("x-powered-by");

    // Enables the CORS
    _express.use(cors());

    // Enables the "gzip" / "deflate" compression for response
    _express.use(compress());

    return _express;
  }
}

export default Http;
