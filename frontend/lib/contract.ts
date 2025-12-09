// Contract Configuration
export const CONTRACT_CONFIG = {
  address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"),
  chainIdHex: "0xaa36a7", // Sepolia: 11155111
  networkName: process.env.NEXT_PUBLIC_NETWORK_NAME || "sepolia",
  relayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL || "https://relayer.testnet.zama.org",
  rpcUrl: "https://sepolia.infura.io/v3/",
  explorerUrl: "https://sepolia.etherscan.io",
}

// Game Constants
export const GAME_CONFIG = {
  boardSize: 5,
  dailyFreeTurns: 3,
  turnPrice: "0.001", // ETH
  totalSquares: 25,
}

// Contract ABI - Knights Tour Smart Contract (Fixed Version - Plaintext)
export const CONTRACT_ABI = [
  // Player Management
  "function registerPlayer() external",
  "function getPlayerInfo(address playerAddress) external view returns (uint256 lastCheckIn, uint32 availableTurns, uint32 totalGamesWon, uint32 totalGamesPlayed, bool exists)",
  
  // Daily System
  "function dailyCheckIn() external",
  "function canCheckInToday(address playerAddress) external view returns (bool canCheckIn)",
  "function purchaseTurns(uint32 amount) external payable",
  
  // Game Logic
  "function startGame(uint8 startPosition) external",
  "function makeMove(uint8 fromSquare, uint8 toSquare) external",
  "function claimWin() external",
  "function claimWinDirect() external",
  "function forfeitGame() external",
  "function getPossibleMoves(uint8 position) external view returns (uint8[] memory moves)",
  "function isValidKnightMove(uint8 from, uint8 to) external pure returns (bool valid)",
  
  // View Functions
  "function getActiveGameInfo(address playerAddress) external view returns (uint256 gameId, uint8 moveCount, bool completed, bool won)",
  "function isSquareVisited(address playerAddress, uint8 square) external view returns (bool visited)",
  "function getContractStats() external view returns (uint256 totalPlayers, uint256 gamesCompleted, uint256 prizePool)",
  
  // Admin Functions
  "function pause() external",
  "function unpause() external",
  "function withdraw() external",
  "function transferOwnership(address newOwner) external",
  "function paused() external view returns (bool)",
  
  // Events
  "event PlayerRegistered(address indexed player)",
  "event DailyCheckIn(address indexed player, uint256 timestamp, uint32 turnsReceived)",
  "event TurnsPurchased(address indexed player, uint32 amount, uint256 cost)",
  "event GameStarted(address indexed player, uint256 gameId, uint8 startPosition)",
  "event MoveMade(address indexed player, uint256 gameId, uint8 fromSquare, uint8 toSquare, uint8 moveNumber)",
  "event GameCompleted(address indexed player, uint256 gameId, bool won, uint8 totalMoves)",
  "event BadgeAwarded(address indexed player, uint32 totalBadges)",
  "event ContractPaused(address indexed by)",
  "event ContractUnpaused(address indexed by)",
] as const

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: CONTRACT_CONFIG.chainIdHex,
  chainName: "Sepolia Testnet",
  rpcUrls: [CONTRACT_CONFIG.rpcUrl],
  blockExplorerUrls: [CONTRACT_CONFIG.explorerUrl],
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
}

// Wallet Provider Types
export enum WalletProvider {
  METAMASK = "metamask",
  WALLETCONNECT = "walletconnect",
  COINBASE = "coinbase",
  INJECTED = "injected",
}

// Check if contract is configured
export const isContractConfigured = (): boolean => {
  return CONTRACT_CONFIG.address !== "0x0000000000000000000000000000000000000000"
}
