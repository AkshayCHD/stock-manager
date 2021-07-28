import cors from "cors";
import express from "express";
import { Application } from "express";
import compress from "compression";
import expressJwt from "express-jwt";
import Locals from "../providers/Locals";

class Http {
  public static mount(_express: Application): Application {
    console.log("Booting the 'HTTP' middleware...");

    // Disable the x-powered-by header in response
    _express.disable("x-powered-by");

    // Enables the CORS
    _express.use(cors());

    // Enables the "gzip" / "deflate" compression for response
    _express.use(compress());
    _express.use(express.json());
    _express.use(express.urlencoded({ extended: true }));
    _express.use(
      expressJwt({
        secret: Locals.config().appSecret,
        algorithms: ["HS256"],
      }).unless({
        path: [
          { url: "/api/user", methods: ["POST"] },
          { url: /^\/api\/address\/.*\/.*/, methods: ["GET"] },
          { url: /^\/api\/address\/.*/, methods: ["GET"] },
        ],
      })
    );

    return _express;
  }
}

export default Http;
