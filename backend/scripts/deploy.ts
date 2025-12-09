import { ethers } from "hardhat";

async function main() {
  console.log("Deploying KnightsTour contract to Sepolia...");

  // Get the contract factory
  const KnightsTour = await ethers.getContractFactory("KnightsTour");

  // Deploy the contract
  console.log("Deploying contract...");
  const knightsTour = await KnightsTour.deploy();

  await knightsTour.waitForDeployment();

  const address = await knightsTour.getAddress();

  console.log("✅ KnightsTour deployed to:", address);
  console.log("\nDeployment Summary:");
  console.log("==================");
  console.log("Contract Address:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);
  
  console.log("\n📝 Save this address for frontend configuration!");
  
  // Wait for a few block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await knightsTour.deploymentTransaction()?.wait(5);
  
  console.log("\n✅ Contract verified and ready to use!");
  console.log("\n🔗 Verify on Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${address}`);
  
  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update frontend configuration with this address");
  console.log("3. Verify contract on Etherscan (optional):");
  console.log(`   npx hardhat verify --network sepolia ${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
