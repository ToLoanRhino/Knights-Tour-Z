import { ethers } from "hardhat";

async function main() {
  const CONTRACT_ADDRESS = "0xf015Bad187ED58a9762eb93bCdA4776513BEb5c5";
  const PLAYER_ADDRESS = "0x701056900A15a7635F3bfd8F9F87C1d9a605FF31";

  console.log("Testing purchaseTurns on deployed contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  const contract = await ethers.getContractAt("KnightsTour", CONTRACT_ADDRESS);

  // Check contract state
  console.log("\n=== Contract State ===");
  
  const paused = await contract.paused();
  console.log("Paused:", paused);
  
  const owner = await contract.owner();
  console.log("Owner:", owner);
  
  const turnPrice = await contract.TURN_PRICE();
  console.log("Turn price:", ethers.formatEther(turnPrice), "ETH");

  // Check player state
  console.log("\n=== Player State ===");
  
  const canCheckIn = await contract.canCheckInToday(PLAYER_ADDRESS);
  console.log("Can check in:", canCheckIn);
  
  try {
    const playerInfo = await contract.getPlayerInfo(PLAYER_ADDRESS);
    console.log("Player info raw:", playerInfo);
    console.log("- lastCheckIn:", playerInfo[0].toString());
    console.log("- availableTurns (encrypted):", playerInfo[1]);
    console.log("- totalGamesWon (encrypted):", playerInfo[2]);
    console.log("- totalGamesPlayed (encrypted):", playerInfo[3]);
    console.log("- exists:", playerInfo[4]);
  } catch (error: any) {
    console.error("Failed to get player info:", error.message);
  }

  // Try to call purchaseTurns with deployer account
  console.log("\n=== Attempting purchaseTurns with deployer ===");
  
  // First check if deployer is registered
  const deployerInfo = await contract.getPlayerInfo(deployer.address);
  console.log("Deployer registered:", deployerInfo[4]);

  if (!deployerInfo[4]) {
    console.log("Registering deployer first...");
    try {
      const regTx = await contract.registerPlayer();
      await regTx.wait();
      console.log("Deployer registered successfully!");
    } catch (error: any) {
      console.error("Registration failed:", error.message);
    }
  }

  // Now try purchaseTurns
  console.log("\nCalling purchaseTurns(1) with 0.001 ETH...");
  
  try {
    const tx = await contract.purchaseTurns(1, {
      value: ethers.parseEther("0.001"),
      gasLimit: 500000
    });
    
    console.log("Transaction hash:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("Transaction status:", receipt?.status);
    console.log("Gas used:", receipt?.gasUsed.toString());
    
    console.log("\n✅ purchaseTurns SUCCESS!");
  } catch (error: any) {
    console.error("\n❌ purchaseTurns FAILED!");
    console.error("Error message:", error.message);
    console.error("Error reason:", error.reason);
    console.error("Error code:", error.code);
    
    // Try to get revert reason
    if (error.data) {
      try {
        const iface = contract.interface;
        const decodedError = iface.parseError(error.data);
        console.error("Decoded error:", decodedError);
      } catch (e) {
        console.error("Raw error data:", error.data);
      }
    }
  }

  // Try staticCall to get error without gas
  console.log("\n=== Trying staticCall for detailed error ===");
  try {
    await contract.purchaseTurns.staticCall(1, {
      value: ethers.parseEther("0.001")
    });
    console.log("staticCall succeeded");
  } catch (error: any) {
    console.error("staticCall failed:", error.message);
    console.error("Revert reason:", error.reason);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
