import { ethers } from "hardhat";

async function main() {
  console.log("Deploying FHETest contract to Sepolia...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy FHETest
  const FHETest = await ethers.getContractFactory("FHETest");
  const fheTest = await FHETest.deploy();
  await fheTest.waitForDeployment();
  
  const address = await fheTest.getAddress();
  console.log("✅ FHETest deployed to:", address);
  
  // Test 1: Create first encrypted value
  console.log("\n=== Test 1: Create encrypted value (5) ===");
  try {
    const tx1 = await fheTest.testCreateEncrypted(5);
    console.log("Tx hash:", tx1.hash);
    const receipt1 = await tx1.wait();
    console.log("Status:", receipt1?.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas used:", receipt1?.gasUsed.toString());
    
    // Check events
    const events1 = receipt1?.logs || [];
    console.log("Events:", events1.length);
  } catch (error: any) {
    console.error("❌ Test 1 FAILED:", error.message);
  }
  
  // Test 2: Create second encrypted value
  console.log("\n=== Test 2: Create second encrypted value (3) ===");
  try {
    const tx2 = await fheTest.testCreateSecond(3);
    console.log("Tx hash:", tx2.hash);
    const receipt2 = await tx2.wait();
    console.log("Status:", receipt2?.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas used:", receipt2?.gasUsed.toString());
  } catch (error: any) {
    console.error("❌ Test 2 FAILED:", error.message);
  }
  
  // Get current values
  console.log("\n=== Current Values ===");
  try {
    const values = await fheTest.getValues();
    console.log("Value 1:", values[0]);
    console.log("Value 2:", values[1]);
    console.log("Sum:", values[2]);
    console.log("Values equal?", values[0] === values[1]);
  } catch (error: any) {
    console.error("❌ Failed to get values:", error.message);
  }
  
  // Test 3: Add the two values
  console.log("\n=== Test 3: FHE.add (value1 + value2) ===");
  try {
    const tx3 = await fheTest.testAdd({ gasLimit: 500000 });
    console.log("Tx hash:", tx3.hash);
    const receipt3 = await tx3.wait();
    console.log("Status:", receipt3?.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas used:", receipt3?.gasUsed.toString());
    console.log("\n🎉 FHE.add WORKS!");
  } catch (error: any) {
    console.error("❌ Test 3 FAILED (FHE.add):", error.message);
    console.error("This confirms FHE.add is the problem!");
  }
  
  // Test 4: All-in-one test
  console.log("\n=== Test 4: All-in-one (2 + 3) ===");
  try {
    const tx4 = await fheTest.testAllInOne(2, 3, { gasLimit: 500000 });
    console.log("Tx hash:", tx4.hash);
    const receipt4 = await tx4.wait();
    console.log("Status:", receipt4?.status === 1 ? "SUCCESS" : "FAILED");
    console.log("Gas used:", receipt4?.gasUsed.toString());
  } catch (error: any) {
    console.error("❌ Test 4 FAILED:", error.message);
  }
  
  // Final values
  console.log("\n=== Final Values ===");
  try {
    const finalValues = await fheTest.getValues();
    console.log("Value 1:", finalValues[0]);
    console.log("Value 2:", finalValues[1]);
    console.log("Sum:", finalValues[2]);
  } catch (error: any) {
    console.error("Failed to get final values:", error.message);
  }
  
  console.log("\n✅ FHE Test complete!");
  console.log("Contract address:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
