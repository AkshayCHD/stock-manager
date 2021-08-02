import cors from "cors";
import express from "express";
import { Application } from "express";
import compress from "compression";
import expressJwt from "express-jwt";
import Locals from "../providers/Locals";
import swaggerUIDist from "swagger-ui-dist";
import YAML from "yamljs";
import swaggerUi from "swagger-ui-express";
import morgan from "morgan";

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

    const swaggerDocument = YAML.load(`${__dirname}/../../swagger-config.yaml`);

    _express.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument)
    );
    _express.use(
      expressJwt({
        secret: Locals.config().appSecret,
        algorithms: ["HS256"],
      }).unless({
        path: [
          { url: "/api/user", methods: ["POST"] },
          { url: "/api/api-docs", methods: ["GET", "POST"] },
          { url: "/api-docs", methods: ["GET", "POST"] },
          { url: /^\/api\/address\/.*\/.*/, methods: ["GET"] },
          { url: /^\/api\/address\/.*/, methods: ["GET"] },
        ],
      })
    );
    _express.use(morgan("dev"));
    return _express;
  }
}

export default Http;
