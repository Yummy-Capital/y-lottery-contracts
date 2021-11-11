import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const getHDWallet = () => {
  const { MNEMONIC, PRIVATE_KEY } = process.env;
  if (MNEMONIC && MNEMONIC !== "") {
    return {
      mnemonic: MNEMONIC,
    };
  }

  if (PRIVATE_KEY && PRIVATE_KEY !== "") {
    return [PRIVATE_KEY];
  }

  throw Error("Private Key Not Set! Please set up .env");
};

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
  networks: {
    testnet: {
      url: "https://cronos-testnet-3.crypto.org:8545/",
      accounts: getHDWallet(),
    },

    mainnet: {
      url: "https://evm-cronos.crypto.org",
      accounts: getHDWallet(),
    },

    hardhat: {
      hardfork: "berlin",
      gasPrice: 1,
    },
  },
};

export default config;
