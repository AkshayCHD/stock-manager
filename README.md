# Stock Tracker API

The appication is a stock management API. It can be used to track a user's holdings, create new securities, create buy and sell transaction, revert transactions, update transactions, calculate average price and average returns.

## High Level Architecture

![sdasdas](https://drive.google.com/uc?export=view&id=1XzheJISS4bxO0l-EFbM_qW0rLLCVtvTj)

#### User

- User schema contains information about the user like his userName, mobile, funds he has to buy shares etc.

#### Holdings

- Represent a user's holdings of a particular share. It contains information about the number of shares of a particular stock held by the user, the average price, the total returns from that share etc.
- In case we add a new buy or sell transaction, then we take the values present in holding object, like averagePrice, and shareCount for calculating their new values, but if we update or delete a transaction, the holdings of a user are recreated from the history of transactions.

#### Transactions

- Stores all the trades that are done by the user, a trade can be of 2 types `BUY` or `SELL`.
- Each transaction contains details like the number of shares that were exchanged, the price at which they were shared.
- A transaction can be created, deleted and updated, given the fact that it upholds the consistency of the system, in cases of conflicts if problems like double spending occurs and the transaction deletion/updation is terminated and the user is shown correcponding error.

#### Security

- Contains the different types of securities that are available to trade upon, they can be shares of a company like TCS, Wipro etc or some comodity like gold, grains etc.
- Users can only trade in securities that are listed on the security schema.

## Steps to setup

- Clone the project

```
git clone https://github.com/AkshayCHD/stock-manager.git
```

- change directory to the project

```
cd stock-manager
```

- run  
  `npm install`
- create .env file with the following format

```
MONGOOSE_URL=<MONGODB_URI>
PORT=<PORT>
APP_SECRET=<APP_SECRET>
JWT_EXPIRES_IN=<JWT_EXPIRES_IN>
API_PREFIX=<API_PREFIX>
```

- run  
  `npm start`
- Navigate to the url and port where the project was started, like localhost and 5521 and open api explorer

![sdasdas](https://drive.google.com/uc?export=view&id=1V3K-lZpdREmUbS-NV_i1iPgRhfnlqIiZ)

```
http://localhost:5521/api-docs
```

- Hit the `POST /user` path that is open, to get the authorisation token, to authorise other apis.
- To run application tests, create `.env.test` file in the root directory.
- then run the command

```
npm run test
```
