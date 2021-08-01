# Stock Tracker API

The appication is a stock management API. It can be used to track a user's holdings, create new securities, create buy and sell transaction, revert transactions, update transactions, calculate average price and average returns.

## High Level Architecture

![sdasdas](https://drive.google.com/uc?export=view&id=1c23xrNTzgfmtXKUVgtGEV69HihnONv7T)

#### User

- User schema contains information about the user like the funds he has to buy shares, his total returns etc.
- If some shares are sold then the funds received by selling are not immediately added to the user's account as there are still chances of the transaction being modified or deleted, so the funds are stored in another identifier called lockedFunds, with a lockin period, and are unlocked on the next trading day to be used for purchase. Another identifier lockedTill helps us keep a track of the the lockin time.

#### Holdings

- Represent a user's holdings of a particular share. It contains information about the number of shares of a particular stock held by the user, the average price, also the number of shares that are locked.
- Like in case of user's funds the shares that a user buys are also locked till the time the transaction can be deleted or updated(till the next trading day). After that time the shares are automatically moved to users active share tally.

#### Transactions

- Stores all the trades that are done by the user, a trade can be of 2 types `BUY` or `SELL`.
- Each transaction contains details like the number of shares that were exchanged, the price at which they were shared, the average price of the share for the user when the transaction was made etc.
- A transaction also contains an identifier name unlockedTill, which represents the time till which the transaction is unlocked i.e. the time till which it can be deleted or updated, after this no such operation is possible on the transaction.

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
- run  
  `npm start`
- Navigate to the url and port where the project was started, like localhost and 5521 and open api explorer

![sdasdas](https://drive.google.com/uc?export=view&id=1V3K-lZpdREmUbS-NV_i1iPgRhfnlqIiZ)

```
http://localhost:5521/api-docs
```

- Hit the `POST /user` path that is open, to get the authorisation token, to authorise other apis.
