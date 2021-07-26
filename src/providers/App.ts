import Express from "./Express";
import { Database } from "./Database";

// import Log from "../middlewares/Log";

class App {
  // Loads your Server
  public loadServer(): void {
    // Log.info("Server :: Booting @ Master...");

    Express.init();
  }

  // Loads the Database Pool
  public loadDatabase(mongoUri: string): void {
    // Log.info("Database :: Booting @ Master...");

    Database.init(mongoUri);
  }
}

export default new App();
