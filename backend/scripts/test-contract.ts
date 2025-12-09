import { ethers } from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0xf015Bad187ED58a9762eb93bCdA4776513BEb5c5";
  const TEST_PLAYER = "0x701056900A15a7635F3bfd8F9F87C1d9a605FF31";

  console.log("Testing contract at:", CONTRACT_ADDRESS);
  console.log("Testing with player:", TEST_PLAYER);
  console.log();

  const contract = await ethers.getContractAt("KnightsTour", CONTRACT_ADDRESS);

  // Check if contract is paused
  const isPaused = await contract.paused();
  console.log("Contract paused:", isPaused);

  // Check owner
  const owner = await contract.owner();
  console.log("Contract owner:", owner);

  // Check contract stats
  const stats = await contract.getContractStats();
  console.log("Total players registered:", stats[0].toString());
  console.log("Total games completed:", stats[1].toString());
  console.log("Prize pool:", ethers.formatEther(stats[2]), "ETH");

  // Check if test player exists
  try {
    const canCheckIn = await contract.canCheckInToday(TEST_PLAYER);
    console.log("\nPlayer can check in:", canCheckIn);
  } catch (error: any) {
    console.log("\nPlayer check error:", error.message);
  }

  // Try to check player info (may fail with encrypted types)
  try {
    const playerInfo = await contract.getPlayerInfo(TEST_PLAYER);
    console.log("\nPlayer info:");
    console.log("- Last check-in:", playerInfo.lastCheckIn.toString());
    console.log("- Exists:", playerInfo.exists);
  } catch (error: any) {
    console.log("\nFailed to get player info:", error.message);
  }

  console.log("\n✅ Contract test complete");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
