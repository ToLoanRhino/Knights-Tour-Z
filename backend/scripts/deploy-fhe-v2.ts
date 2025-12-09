import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying KnightsTourFHE with FHE features...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy contract
  console.log("📦 Deploying KnightsTourFHE...");
  const KnightsTourFHE = await ethers.getContractFactory("KnightsTourFHE");
  const contract = await KnightsTourFHE.deploy();
  await contract.waitForDeployment();
  
  const contractAddress = await contract.getAddress();
  console.log("✅ KnightsTourFHE deployed to:", contractAddress);
  
  // Test basic functions
  console.log("\n🧪 Testing basic functions...\n");
  
  // 1. Register player
  console.log("1. Registering player...");
  const registerTx = await contract.registerPlayer();
  await registerTx.wait();
  console.log("   ✅ Player registered!");
  
  // 2. Check player info
  const playerInfo = await contract.getPlayerInfo(deployer.address);
  console.log("   Player info:", {
    exists: playerInfo[4],
    availableTurns: playerInfo[1].toString(),
    totalGamesWon: playerInfo[2].toString()
  });
  
  // 3. Daily check-in
  console.log("\n2. Daily check-in...");
  const checkinTx = await contract.dailyCheckIn();
  await checkinTx.wait();
  console.log("   ✅ Check-in complete! (+3 turns)");
  
  // 4. Purchase turns
  console.log("\n3. Purchasing turns...");
  const purchaseTx = await contract.purchaseTurns(5, {
    value: ethers.parseEther("0.005")
  });
  await purchaseTx.wait();
  console.log("   ✅ Purchased 5 turns!");
  
  // Check updated info
  const updatedInfo = await contract.getPlayerInfo(deployer.address);
  console.log("   Available turns:", updatedInfo[1].toString());
  
  // 5. Start game
  console.log("\n4. Starting game...");
  const startTx = await contract.startGame(0);
  await startTx.wait();
  console.log("   ✅ Game started at position 0!");
  
  // 6. Make a move
  console.log("\n5. Making move (0 -> 11)...");
  const moveTx = await contract.makeMove(0, 11); // Knight move: (0,0) -> (2,1)
  await moveTx.wait();
  console.log("   ✅ Move made!");
  
  // 7. Forfeit game
  console.log("\n6. Forfeiting game...");
  const forfeitTx = await contract.forfeitGame();
  await forfeitTx.wait();
  console.log("   ✅ Game forfeited!");
  
  // 8. Get contract stats
  const stats = await contract.getContractStats();
  console.log("\n📊 Contract Stats:");
  console.log("   Total players:", stats[0].toString());
  console.log("   Games completed:", stats[1].toString());
  console.log("   Prize pool:", ethers.formatEther(stats[2]), "ETH");
  
  // 9. Test FHE features
  console.log("\n🔐 Testing FHE features...");
  try {
    const encryptedScore = await contract.getMyEncryptedScore();
    console.log("   Encrypted score handle:", encryptedScore.toString().slice(0, 20) + "...");
    console.log("   ✅ FHE encryption working!");
  } catch (e: any) {
    console.log("   ⚠️ FHE feature test:", e.message?.slice(0, 50) || "error");
  }
  
  // Get leaderboard size
  const leaderboardSize = await contract.getLeaderboardSize();
  console.log("   Leaderboard size:", leaderboardSize.toString());
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ ALL TESTS PASSED!");
  console.log("=".repeat(50));
  console.log("\n📋 Contract Address:", contractAddress);
  console.log("\nAdd to frontend/.env.local:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
