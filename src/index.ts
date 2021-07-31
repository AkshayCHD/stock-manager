import App from "./providers/App";

import Locals from "./providers/Locals";

import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, ".env") });
/**
 * Run the Database pool
 */
App.loadDatabase(Locals.config().mongooseUrl);

/**
 * Run the Server on Clusters
 */
App.loadServer();
