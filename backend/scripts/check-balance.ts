import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(address);
  
  console.log("========================================");
  console.log("Deployer Address:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  console.log("========================================");
  
  const minRequired = ethers.parseEther("0.01"); // 0.01 ETH minimum
  
  if (balance < minRequired) {
    console.log("\n⚠️  WARNING: Low balance!");
    console.log("You need at least 0.01 ETH for deployment");
    console.log("\nGet Sepolia ETH from:");
    console.log("- https://sepoliafaucet.com/");
    console.log("- https://www.alchemy.com/faucets/ethereum-sepolia");
  } else {
    console.log("\n✅ Sufficient balance for deployment!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
