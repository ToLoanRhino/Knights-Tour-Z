import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const CONTRACT_ADDRESS = "0xf015Bad187ED58a9762eb93bCdA4776513BEb5c5";

  console.log("Extracting ABI from compiled contract...\n");

  // Get artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/KnightsTour.sol/KnightsTour.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  console.log("Contract name:", artifact.contractName);
  console.log("Compiler version:", artifact.metadata ? JSON.parse(artifact.metadata).compiler.version : "unknown");
  console.log();

  // Extract function signatures
  console.log("📝 Available Functions:");
  console.log("=".repeat(60));
  
  artifact.abi
    .filter((item: any) => item.type === "function")
    .forEach((func: any) => {
      const inputs = func.inputs.map((i: any) => `${i.type} ${i.name}`).join(", ");
      const outputs = func.outputs?.map((o: any) => o.type).join(", ") || "void";
      const state = func.stateMutability || "nonpayable";
      
      console.log(`${func.name}(${inputs})`);
      console.log(`  ├─ Returns: ${outputs}`);
      console.log(`  └─ State: ${state}`);
      console.log();
    });

  // Create simplified ABI for frontend
  const simplifiedABI = artifact.abi
    .filter((item: any) => item.type === "function" || item.type === "event")
    .map((item: any) => {
      if (item.type === "function") {
        const inputs = item.inputs.map((i: any) => `${i.type} ${i.name || ""}`).join(", ");
        const outputs = item.outputs?.map((o: any) => o.type).join(", ") || "";
        const returns = outputs ? ` returns (${outputs})` : "";
        return `function ${item.name}(${inputs}) ${item.stateMutability}${returns}`;
      } else {
        const inputs = item.inputs.map((i: any) => `${i.type}${i.indexed ? " indexed" : ""} ${i.name}`).join(", ");
        return `event ${item.name}(${inputs})`;
      }
    });

  console.log("\n📋 Simplified ABI for frontend:");
  console.log("=".repeat(60));
  console.log(JSON.stringify(simplifiedABI, null, 2));

  // Save to file
  const outputPath = path.join(__dirname, "../simplified-abi.json");
  fs.writeFileSync(outputPath, JSON.stringify(simplifiedABI, null, 2));
  console.log(`\n✅ Saved to: ${outputPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
