import mongoose from "mongoose";
import * as bluebird from "bluebird";

// import Log from "../middlewares/Log";

export class Database {
  // Initialize your database pool
  public static init(mongoUri: string): any {
    mongoose.set("useNewUrlParser", true);
    mongoose.set("useUnifiedTopology", true);

    mongoose.connect(mongoUri, {
      keepAlive: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    mongoose.connection.on("connected", async function () {
      console.log(`Connected to ${mongoUri} at ${new Date().toISOString()}`);
    });

    mongoose.connection.on("error", () => {
      throw new Error(`unable to connect to database: ${mongoUri}`);
    });
  }
}

export default mongoose;
