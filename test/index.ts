import { BigNumber } from "@ethersproject/bignumber";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

describe("Lottery", function () {
  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let accounts: Signer[] = [];
  let manager: string;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    accounts = await ethers.getSigners();
    manager = await accounts[0].getAddress();
  });

  describe("Permissions", function () {
    const strict = true;
    const ticketPrice = ethers.utils.parseEther("1.0");
    const maxParticipants = 5;
    const maxDuration = 100;
    const fee = 250;

    it("Lottery termination by the owner should be successful", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      const tx = await lottery.terminate(true);
      const result = await tx.wait();

      expect(result.events![0].event).to.equal("LotteryDeactivated");
    });

    it("Lottery termination by a non-owner should not be successful", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      const tx = lottery.connect(accounts[1]).terminate(true);
      await expect(tx).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Information", function () {
    const strict = true;
    const ticketPrice = ethers.utils.parseEther("1.0");
    const maxParticipants = 5;
    const maxDuration = 100;
    const fee = 250;

    it("The lottery information to be returned should be the same as the one being initiated", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      const information = await lottery.getInfo();

      // current state
      expect(information[0]).to.equal(1);

      // strict mode?
      expect(information[1]).to.equal(strict);

      // ticket price
      expect(information[2]).to.equal(ticketPrice);

      // current number of participants
      expect(information[3]).to.equal(0);

      // max number of participants
      expect(information[4]).to.equal(maxParticipants);

      // TODO: end time
      // expect(information[5]).to.equal(x + maxDuration);

      // max duration
      expect(information[6]).to.equal(maxDuration);

      // total tickets purchased
      expect(information[7]).to.equal(0);

      // bonded tokens
      expect(information[8]).to.equal(0);

      // fee
      expect(information[9]).to.equal(fee);

      // manager address
      expect(information[10]).to.equal(manager);

      // token address
      expect(information[11]).to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    });
  });

  describe("Lottery I (strict)", function () {
    const strict = true;
    const ticketPrice = ethers.utils.parseEther("1.0");
    const maxParticipants = 5;
    const maxDuration = 100;
    const fee = 250;

    it("Should one player be successfully added to the lottery", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      await lottery.connect(accounts[1]).enter(1, { value: ticketPrice });
      const information = await lottery.getInfo();

      // current number of participants
      expect(information[3]).to.equal(1);

      // total tickets purchased
      expect(information[7]).to.equal(1);

      // bonded tokens
      expect(information[8]).to.equal(ticketPrice);
    });

    it("Should two players be successfully added to the lottery", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      await lottery.connect(accounts[1]).enter(1, { value: ticketPrice });
      await lottery.connect(accounts[2]).enter(1, { value: ticketPrice });
      const information = await lottery.getInfo();

      // current number of participants
      expect(information[3]).to.equal(2);

      // total tickets purchased
      expect(information[7]).to.equal(2);

      // bonded tokens
      expect(information[8]).to.equal(ticketPrice.mul(2));
    });

    it("Should not be able to enter with two or more tickets", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      const tx = lottery
        .connect(accounts[1])
        .enter(2, { value: ticketPrice.mul(2) });
      await expect(tx).to.be.revertedWith("INCORRECT_TICKETS_AMOUNT");
    });

    it("Should not be able to enter with an amount not equal to the ticket price", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      const tx = lottery
        .connect(accounts[1])
        .enter(1, { value: ticketPrice.mul(2) });
      await expect(tx).to.be.revertedWith("INCORRECT_TICKETS_COST");
    });

    it("Should not be able to enter twice", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      await lottery.connect(accounts[1]).enter(1, { value: ticketPrice });
      const tx = lottery.connect(accounts[1]).enter(1, { value: ticketPrice });
      await expect(tx).to.be.revertedWith("IMPOSSIBLE_TO_BUY_MORE");
    });
  });

  describe("Lottery II (non-strict)", function () {
    const strict = false;
    const ticketPrice = ethers.utils.parseEther("1.0");
    const maxParticipants = 5;
    const maxDuration = 100;
    const fee = 250;

    it("Should one player be successfully added to the lottery", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      await lottery.connect(accounts[1]).enter(1, { value: ticketPrice });
      const information = await lottery.getInfo();

      // current number of participants
      expect(information[3]).to.equal(1);

      // total tickets purchased
      expect(information[7]).to.equal(1);

      // bonded tokens
      expect(information[8]).to.equal(ticketPrice);
    });

    it("Should successfully add two players to the lottery", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      await lottery.connect(accounts[1]).enter(1, { value: ticketPrice });
      await lottery.connect(accounts[2]).enter(1, { value: ticketPrice });
      const information = await lottery.getInfo();

      // current number of participants
      expect(information[3]).to.equal(2);

      // total tickets purchased
      expect(information[7]).to.equal(2);

      // bonded tokens
      expect(information[8]).to.equal(ticketPrice.mul(2));
    });

    it("Should be able to enter with two or more tickets", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      await lottery
        .connect(accounts[1])
        .enter(2, { value: ticketPrice.mul(2) });
      await lottery
        .connect(accounts[2])
        .enter(3, { value: ticketPrice.mul(3) });
      const information = await lottery.getInfo();

      // current number of participants
      expect(information[3]).to.equal(2);

      // total tickets purchased
      expect(information[7]).to.equal(5);

      // bonded tokens
      expect(information[8]).to.equal(ticketPrice.mul(5));
    });

    it("Should not be able to enter with an amount not equal to the ticket price", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      const tx = lottery
        .connect(accounts[1])
        .enter(1, { value: ticketPrice.mul(2) });
      await expect(tx).to.be.revertedWith("INCORRECT_TICKETS_COST");
    });

    it("Should be able to enter twice", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");
      const lottery = await Lottery.deploy(
        strict,
        ticketPrice,
        maxParticipants,
        maxDuration,
        fee,
        manager
      );
      await lottery.deployed();

      await lottery.connect(accounts[1]).enter(1, { value: ticketPrice });
      await lottery
        .connect(accounts[1])
        .enter(2, { value: ticketPrice.mul(2) });
      const information = await lottery.getInfo();

      // current number of participants
      expect(information[3]).to.equal(1);

      // total tickets purchased
      expect(information[7]).to.equal(3);

      // bonded tokens
      expect(information[8]).to.equal(ticketPrice.mul(3));
    });
  });

  // INFO: hardfork should be < london to test this
  describe("Simulations", function () {
    // strict
    const l1 = {
      strict: true,
      ticketPrice: ethers.utils.parseEther("0.1"),
      maxParticipants: 3,
      maxDuration: 100,
      fee: 250,
      ticketsToBePurchased: 1,
    };

    // non-strict
    const l2 = {
      strict: false,
      ticketPrice: ethers.utils.parseEther("0.55"),
      maxParticipants: 7,
      maxDuration: 100,
      fee: 100,
      ticketsToBePurchased: 3,
    };

    it("Should be passed", async function () {
      const Lottery = await ethers.getContractFactory("Lottery");

      const lottery1 = await Lottery.deploy(
        l1.strict,
        l1.ticketPrice,
        l1.maxParticipants,
        l1.maxDuration,
        l1.fee,
        manager
      );
      await lottery1.deployed();

      const lottery2 = await Lottery.deploy(
        l2.strict,
        l2.ticketPrice,
        l2.maxParticipants,
        l2.maxDuration,
        l2.fee,
        manager
      );
      await lottery2.deployed();

      // accounts
      // =>

      let gasUsed = BigNumber.from(0);
      let initialSum = BigNumber.from(0);
      let finalSum = BigNumber.from(0);

      // owner
      // =>

      let initialBalance = BigNumber.from(0);
      let totalFee = BigNumber.from(0);

      // participants
      // =>

      const count = accounts.length - 1;

      // initial values
      // =>

      for (let i = 0; i <= count; i++) {
        const x = accounts[i];
        const balance = await x.getBalance();

        if (i === 0) {
          initialBalance = initialBalance.add(balance);
        } else {
          initialSum = initialSum.add(balance);
        }
      }

      // simmulate
      // =>

      for (let i = 1; i <= count; i++) {
        const x = accounts[i];

        // strict
        const tx1 = await lottery1.connect(x).enter(l1.ticketsToBePurchased, {
          value: l1.ticketPrice.mul(l1.ticketsToBePurchased),
        });

        // non-strict
        const tx2 = await lottery2.connect(x).enter(l2.ticketsToBePurchased, {
          value: l2.ticketPrice.mul(l2.ticketsToBePurchased),
        });

        const r1 = await tx1.wait();
        const r2 = await tx2.wait();

        gasUsed = gasUsed.add(r1.gasUsed);
        gasUsed = gasUsed.add(r2.gasUsed);
      }

      // check
      // =>

      const information1 = await lottery1.getInfo();
      const information2 = await lottery2.getInfo();

      // the number of participants remaining in the lottery1
      const v1 = count % l1.maxParticipants;

      // current number of participants
      expect(information1[3]).to.equal(v1);

      // bonded tokens
      expect(information1[8]).to.equal(
        l1.ticketPrice.mul(v1).mul(l1.ticketsToBePurchased)
      );

      // the number of participants remaining in the lottery2
      const v2 = count % l2.maxParticipants;

      // current number of participants
      expect(information2[3]).to.equal(v2);

      // bonded tokens
      expect(information2[8]).to.equal(
        l2.ticketPrice.mul(v2).mul(l2.ticketsToBePurchased)
      );

      // final values
      // =>

      for (let i = 0; i <= count; i++) {
        const x = accounts[i];
        const balance = await x.getBalance();

        if (i === 0) {
          // total fee received by the manager
          totalFee = balance.sub(initialBalance);
        } else {
          // the sum of all balances of the participants
          finalSum = finalSum.add(balance);
        }
      }

      expect(finalSum).to.equal(
        initialSum
          // subtract bonded tokens remaining in lottery1
          .sub(information1[8])
          // subtract bonded tokens remaining in lottery2
          .sub(information2[8])
          // subtract tx fee (gasPrice = 1, hardfork < london required for accuracy)
          .sub(gasUsed)
          // subtract total fee received by the manager
          .sub(totalFee)
      );
    });
  });
});
