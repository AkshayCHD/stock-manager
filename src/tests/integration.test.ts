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
import Holding, { IHoldingModel } from "../models/holdings.model";
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
      currentPrice: 500,
    }).save();
  });
  describe("Large test case to validate all cases", async () => {
    it("Large test case Delete", async () => {
      let holding: IHoldingModel | null;
      let result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 15 })
        .set({ Authorization: `Bearer ${token}` });
      await Security.findByIdAndUpdate(security._id, { currentPrice: 100 });
      result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });

      const transaction1 = result.body.transaction;
      result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });

      const transaction2 = result.body.transaction;
      result = await chai
        .request(app)
        .post(`/api/transaction/sell/${security.ticker}`)
        .send({ shareCount: 5 })
        .set("content-type", "application/json")
        .set({ Authorization: `Bearer ${token}` });
      const transaction3 = result.body.transaction;

      result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });

      holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      assert.equal(holding?.shareCount, 25);
      assert.equal(holding?.averagePrice, 292);
      assert.equal(holding?.totalReturns, -1200);
      result = await chai
        .request(app)
        .delete(`/api/transaction/${transaction1._id}`)
        .set("content-type", "application/json")
        .set({ Authorization: `Bearer ${token}` });

      holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      assert.equal(holding?.shareCount, 20);
      assert.equal(holding?.totalReturns, -1500);

      assert.equal(holding?.averagePrice, 325);
    });

    it("Large test case Update", async () => {
      let holding: IHoldingModel | null;
      let result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 15 })
        .set({ Authorization: `Bearer ${token}` });
      await Security.findByIdAndUpdate(security._id, { currentPrice: 100 });
      result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });

      const transaction1 = result.body.transaction;
      result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });

      const transaction2 = result.body.transaction;
      result = await chai
        .request(app)
        .post(`/api/transaction/sell/${security.ticker}`)
        .send({ shareCount: 5 })
        .set("content-type", "application/json")
        .set({ Authorization: `Bearer ${token}` });
      const transaction3 = result.body.transaction;

      result = await chai
        .request(app)
        .post(`/api/transaction/buy/${security.ticker}`)
        .set("content-type", "application/json")
        .send({ shareCount: 5 })
        .set({ Authorization: `Bearer ${token}` });

      holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      let updatedUser = await User.findById(userId);
      assert.equal(updatedUser?.funds, 91500);
      assert.equal(holding?.shareCount, 25);
      assert.equal(holding?.averagePrice, 292);
      assert.equal(holding?.totalReturns, -1200);
      result = await chai
        .request(app)
        .put(`/api/transaction/${transaction2._id}`)
        .send({ type: "SELL" })
        .set("content-type", "application/json")
        .set({ Authorization: `Bearer ${token}` });

      holding = await Holding.findOne({
        user: userId,
        ticker: security.ticker,
      });
      assert.equal(holding?.shareCount, 15);
      assert.equal(holding?.totalReturns, -3000);
      assert.equal(holding?.averagePrice, 300);
      updatedUser = await User.findById(userId);
      assert.equal(updatedUser?.funds, 92500);
    });
  });

  afterEach(async () => {
    await User.deleteMany();
    await Transaction.deleteMany();
    await Holding.deleteMany();
    await Security.deleteMany();
  });
});
