import { ethers } from "hardhat";

async function main() {
  console.log("Deploying KnightsTourFixed to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy
  const Contract = await ethers.getContractFactory("KnightsTourFixed");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("✅ KnightsTourFixed deployed to:", address);
  
  // Test all functions
  console.log("\n=== Testing Contract ===");
  
  // Register
  console.log("\n1. Register player...");
  const regTx = await contract.registerPlayer();
  await regTx.wait();
  console.log("✅ Player registered!");
  
  // Check player info
  const info = await contract.getPlayerInfo(deployer.address);
  console.log("Player info:", {
    lastCheckIn: info[0].toString(),
    availableTurns: info[1].toString(),
    totalGamesWon: info[2].toString(),
    totalGamesPlayed: info[3].toString(),
    exists: info[4]
  });
  
  // Daily check-in
  console.log("\n2. Daily check-in...");
  const checkInTx = await contract.dailyCheckIn();
  await checkInTx.wait();
  console.log("✅ Daily check-in complete!");
  
  const infoAfterCheckIn = await contract.getPlayerInfo(deployer.address);
  console.log("Turns after check-in:", infoAfterCheckIn[1].toString());
  
  // Purchase turns
  console.log("\n3. Purchase 5 turns...");
  const purchaseTx = await contract.purchaseTurns(5, {
    value: ethers.parseEther("0.005")
  });
  const purchaseReceipt = await purchaseTx.wait();
  console.log("✅ Purchase successful!");
  console.log("Gas used:", purchaseReceipt?.gasUsed.toString());
  
  const infoAfterPurchase = await contract.getPlayerInfo(deployer.address);
  console.log("Turns after purchase:", infoAfterPurchase[1].toString());
  
  // Start game
  console.log("\n4. Start game at position 0...");
  const startTx = await contract.startGame(0);
  await startTx.wait();
  console.log("✅ Game started!");
  
  const gameInfo = await contract.getActiveGameInfo(deployer.address);
  console.log("Game info:", {
    gameId: gameInfo[0].toString(),
    moveCount: gameInfo[1].toString(),
    completed: gameInfo[2],
    won: gameInfo[3]
  });
  
  // Make a move
  console.log("\n5. Make a move (0 -> 11)...");
  const moveTx = await contract.makeMove(0, 11);
  await moveTx.wait();
  console.log("✅ Move made!");
  
  const gameInfoAfterMove = await contract.getActiveGameInfo(deployer.address);
  console.log("Move count:", gameInfoAfterMove[1].toString());
  
  // Forfeit game
  console.log("\n6. Forfeit game...");
  const forfeitTx = await contract.forfeitGame();
  await forfeitTx.wait();
  console.log("✅ Game forfeited!");
  
  // Final stats
  console.log("\n=== Final Stats ===");
  const finalInfo = await contract.getPlayerInfo(deployer.address);
  console.log("Available turns:", finalInfo[1].toString());
  console.log("Games won:", finalInfo[2].toString());
  console.log("Games played:", finalInfo[3].toString());
  
  const stats = await contract.getContractStats();
  console.log("Total players:", stats[0].toString());
  console.log("Total games completed:", stats[1].toString());
  console.log("Prize pool:", ethers.formatEther(stats[2]), "ETH");
  
  console.log("\n✅ ALL TESTS PASSED!");
  console.log("Contract address:", address);
  console.log("\n📋 Update frontend with this address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
