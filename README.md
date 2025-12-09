# ♞ Knights-Tour-Z

<div align="center">

![Zama](https://img.shields.io/badge/Powered%20by-Zama%20fhEVM-blue)
![Solidity](https://img.shields.io/badge/Solidity-0.8.24-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/License-BSD--3--Clause-yellow)

**A privacy-preserving Knight's Tour puzzle game built with Fully Homomorphic Encryption**

[Live Demo](#) • [Documentation](#how-to-play) • [Contract](#deployed-contract)

</div>

---

## 🎮 About

**Knights-Tour-Z** is a blockchain-based chess puzzle dApp where players navigate a knight across a 5×5 board, visiting every square exactly once. Built for the **Zama Developer Program**, this project demonstrates practical use of **Fully Homomorphic Encryption (FHE)** in gaming.

### Why FHE?

- 🔐 **Encrypted Scores** - Player scores are stored as encrypted values on-chain
- 🏅 **Hidden Achievements** - Badge progress is encrypted until revealed
- 🥷 **Private Rankings** - Compare scores without revealing actual values
- 🔒 **Secure Competition** - Leaderboard privacy with encrypted comparisons

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🎯 **Knight's Tour Puzzle** | Classic chess puzzle on 5×5 board |
| 📅 **Daily Check-in** | Earn 3 free plays every 24 hours |
| 💰 **Buy Plays** | Purchase additional plays (0.001 ETH each) |
| 🏆 **Achievement Badges** | 6 badge levels from 1 to 50 wins |
| 📊 **Player Stats** | Track wins, games played, win rate |
| 🔗 **Multi-Wallet Support** | MetaMask, OKX, Rabby, Phantom |

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ (LTS)
- MetaMask or compatible wallet
- Sepolia testnet ETH

### Backend (Smart Contracts)

```bash
cd backend
npm install

# Set secrets
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set ETHERSCAN_API_KEY

# Compile & Deploy
npm run compile
npx hardhat run scripts/deploy-fhe-v2.ts --network sepolia
```

### Frontend (Next.js)

```bash
cd frontend
npm install

# Update .env.local with contract address
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 How to Play

1. **Connect Wallet** - Connect MetaMask/OKX/Rabby/Phantom
2. **Register** - Create your player account
3. **Get Plays** - Daily check-in (+3) or buy plays
4. **Start Game** - Choose starting position
5. **Move Knight** - Click highlighted L-shaped moves
6. **Win** - Visit all 25 squares to earn badges!

### Knight Movement
```
    ┌───┬───┬───┬───┬───┐
    │   │ X │   │ X │   │
    ├───┼───┼───┼───┼───┤
    │ X │   │   │   │ X │
    ├───┼───┼───┼───┼───┤
    │   │   │ ♞ │   │   │
    ├───┼───┼───┼───┼───┤
    │ X │   │   │   │ X │
    ├───┼───┼───┼───┼───┤
    │   │ X │   │ X │   │
    └───┴───┴───┴───┴───┘
    X = Valid moves from knight position
```

---

## 🏅 Badge System

| Badge | Requirement | Icon |
|-------|-------------|------|
| First Knight | 1 win | 🏆 |
| Rising Star | 3 wins | ⭐ |
| Knight Captain | 5 wins | 🛡️ |
| Knight Commander | 10 wins | ⚔️ |
| Grand Master | 25 wins | 👑 |
| Legend | 50 wins | 🌟 |

---

## 🔐 FHE Integration

This dApp uses **Zama's fhEVM** for privacy-preserving features:

```solidity
// Encrypted score storage
euint32 encryptedScore;
euint32 encryptedBadges;
euint32 encryptedRank;

// Privacy-preserving comparison
function isMyScoreHigherThan(address other) returns (ebool) {
    return FHE.gt(myScore, otherScore);
}
```

### FHE Features Used

- `FHE.asEuint32()` - Encrypt values
- `FHE.allow()` - Grant decryption access
- `FHE.gt()` - Encrypted comparison
- Encrypted badges & rankings

---

## 📁 Project Structure

```
Knights-Tour-Z/
├── backend/                  # Hardhat + Solidity
│   ├── contracts/
│   │   └── KnightsTourFHE.sol
│   ├── scripts/
│   │   └── deploy-fhe-v2.ts
│   └── test/
│       └── KnightsTourFHE.test.ts
│
└── frontend/                 # Next.js + TypeScript
    ├── app/
    │   └── page.tsx
    ├── components/
    │   ├── game-board.tsx
    │   ├── profile.tsx
    │   ├── daily-checkin.tsx
    │   └── buy-plays.tsx
    └── lib/
        └── contract.ts
```

---

## 📜 Deployed Contract

| Network | Address |
|---------|---------|  
| Sepolia | `0x0a72cf50CB2a02Ae8828Af79Db11C8B0CB5eFcCe` |

---

## 🛠️ Tech Stack

**Smart Contracts**
- Solidity 0.8.24
- Zama fhEVM
- Hardhat
- Ethers.js v6

**Frontend**
- Next.js 16 (Turbopack)
- TypeScript
- Tailwind CSS
- ethers.js v6

---

## 📄 License

BSD-3-Clause-Clear

---

<div align="center">

## 👨‍💻 Created by

# **zcarter**

[![Discord](https://img.shields.io/badge/Discord-zcarter-5865F2?logo=discord&logoColor=white)](https://discord.com)

---

**Built with ❤️ for the Zama Developer Program**

*Powered by Zama's Fully Homomorphic Encryption (fhEVM)*

</div>
