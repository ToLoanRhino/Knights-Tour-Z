// Zama Relayer SDK initialization and setup
import { createInstance } from "@zama-fhe/relayer-sdk"

let instance: any = null

export async function initializeRelayer() {
  if (instance) return instance

  try {
    instance = createInstance({
      relayerUrl: "https://relayer.testnet.zama.org",
      network: "sepolia",
    })

    await instance.initSDK()
    console.log("Relayer SDK initialized")
    return instance
  } catch (error) {
    console.error("Failed to initialize Relayer SDK:", error)
    throw error
  }
}

export function getRelayerInstance() {
  return instance
}

// Contract ABI placeholder - Replace with actual ABI
export const KNIGHTS_TOUR_ABI = [
  {
    name: "dailyCheckIn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "getPlays",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "buyPlays",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    name: "completeGameAndClaim",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "hasBadge",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
]

export const CONTRACT_ADDRESS = "0xYOUR_CONTRACT_HERE" // Replace with actual contract address
