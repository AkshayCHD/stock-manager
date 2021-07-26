import App from "./providers/App";

import Locals from "./providers/Locals";
/**
 * Run the Database pool
 */
App.loadDatabase(Locals.config().mongooseUrl);

/**
 * Run the Server on Clusters
 */
App.loadServer();
