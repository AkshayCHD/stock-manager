import * as path from "path";
import * as dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config({ path: path.join(__dirname, "../../.env.test") });
import Locals from "../providers/Locals";
import chaiHttp from "chai-http";
import chai from "chai";
import Express from "../providers/Express";
import { Database } from "../providers/Database";
import express from "express";
import { assert } from "chai";
import User, { IUserModel } from "../models/user.model";
import Transaction from "../models/transaction.model";
import Security, { ISecurity, ISecurityModel } from "../models/security.model";
import jwt from "jsonwebtoken";
import Holding from "../models/holdings.model";
let should = chai.should();

chai.use(chaiHttp);
// const getToken = (userId) => {
//   return jwt.sign({ _id: userId }, Locals.config().appSecret);
// };
describe("Join Broadcast Flow", () => {
  let app: express.Application;
  let user: IUserModel;
  let security: ISecurityModel;
  const userId = mongoose.Types.ObjectId();
  const token = jwt.sign({ _id: userId }, Locals.config().appSecret);
  before((done) => {
    app = Express.init();
    console.log(Locals.config());
    Database.init(Locals.config().mongooseUrl);
    done();
  });
  beforeEach(async () => {
    user = await new User({
      _id: userId,
      userName: "123456789",
      mobile: "123456789",
      funds: 100000,
    }).save();
    security = await new Security({
      _id: userId,
      ticker: "tcs",
      totalShares: 10000,
      sharesForSale: 10000,
      currentPrice: 1000,
    }).save();
  });
  describe("/POST Address", async () => {
    it("Unauthorized error should be given", async () => {
      const result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`);
      const { error } = result.body;
      const status = result.status;
      assert.equal(401, status);
      assert.equal("No authorization token was found", error);
    });
    it("Validate average price for buy at different prices", async () => {
      let result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 10 })
        .set({ Authorization: `Bearer ${token}` });
      const status = result.status;
      assert.equal(status, 200);
      await Security.findByIdAndUpdate(security._id, { currentPrice: 500 });
      result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });
      const updatedUser = await User.findById(userId);
      assert.equal(updatedUser?.funds, 87500);
      const holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      assert.equal(holding?.averagePrice.toFixed(6), (833.333333).toFixed(6));
      assert.equal(holding?.shareCount, 15);
    });

    it("Validate returns for buy and sell", async () => {
      let result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 10 })
        .set({ Authorization: `Bearer ${token}` });
      const status = result.status;
      assert.equal(status, 200);
      await Security.findByIdAndUpdate(security._id, { currentPrice: 500 });
      result = await chai
        .request(app)
        .post(`/api/transaction/sell/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });
      const updatedUser = await User.findById(userId);
      assert.equal(updatedUser?.funds, 92500);
      assert.equal(updatedUser?.totalReturns, -2500);
      const holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      assert.equal(holding?.averagePrice.toFixed(6), (1000).toFixed(6));
      assert.equal(holding?.shareCount, 5);
    });
  });

  afterEach(async () => {
    await User.deleteMany();
    await Transaction.deleteMany();
    await Holding.deleteMany();
    await Security.deleteMany();
  });
});
