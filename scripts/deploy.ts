// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const strict = false;
  const ticketPrice = ethers.utils.parseEther("0.5");
  const maxParticipants = 5;
  const maxDuration = 7 * 24 * 60 * 60;
  const fee = 25;

  // We get the contract to deploy
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(
    strict,
    ticketPrice,
    maxParticipants,
    maxDuration,
    fee,
    deployer.address
  );

  await lottery.deployed();
  console.log("Lottery deployed to:", lottery.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
