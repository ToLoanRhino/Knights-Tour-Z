import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// Use deployed contract on Sepolia for integration tests
const DEPLOYED_CONTRACT = "0xece45C0f9c820D40f1Ed16DA68c0397035Ab390A";

describe("KnightsTourFHE - Integration Tests", function () {
  let contract: any;
  let owner: HardhatEthersSigner;

  before(async function () {
    [owner] = await ethers.getSigners();
    console.log("Testing with account:", owner.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(owner.address)), "ETH");
    
    // Connect to deployed contract
    const KnightsTourFHE = await ethers.getContractFactory("KnightsTourFHE");
    contract = KnightsTourFHE.attach(DEPLOYED_CONTRACT);
  });

  describe("Contract State", function () {
    it("Should have correct owner", async function () {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it("Should have correct constants", async function () {
      expect(await contract.DAILY_FREE_TURNS()).to.equal(3);
      expect(await contract.TURN_PRICE()).to.equal(ethers.parseEther("0.001"));
      expect(await contract.BOARD_SIZE()).to.equal(5);
    });

    it("Should not be paused", async function () {
      expect(await contract.paused()).to.equal(false);
    });

    it("Should have registered players", async function () {
      const stats = await contract.getContractStats();
      expect(stats.totalPlayers).to.be.gte(1);
    });
  });

  describe("Knight Move Validation", function () {
    it("Should validate L-shaped moves", async function () {
      expect(await contract.isValidKnightMove(0, 11)).to.equal(true);  // (0,0) -> (2,1)
      expect(await contract.isValidKnightMove(0, 7)).to.equal(true);   // (0,0) -> (1,2)
      expect(await contract.isValidKnightMove(12, 1)).to.equal(true);  // center -> valid
    });

    it("Should reject non-L-shaped moves", async function () {
      expect(await contract.isValidKnightMove(0, 1)).to.equal(false);  // horizontal
      expect(await contract.isValidKnightMove(0, 5)).to.equal(false);  // vertical
      expect(await contract.isValidKnightMove(0, 6)).to.equal(false);  // diagonal
    });

    it("Should validate various knight positions", async function () {
      // From center (12), valid moves are: 1, 3, 5, 9, 15, 19, 21, 23
      expect(await contract.isValidKnightMove(12, 1)).to.equal(true);
      expect(await contract.isValidKnightMove(12, 3)).to.equal(true);
      expect(await contract.isValidKnightMove(12, 5)).to.equal(true);
      expect(await contract.isValidKnightMove(12, 12)).to.equal(false); // same square
    });
  });

  describe("Player Info (Read-only)", function () {
    it("Should get player info for owner", async function () {
      const info = await contract.getPlayerInfo(owner.address);
      expect(info.exists).to.equal(true);
    });

    it("Should get contract stats", async function () {
      const stats = await contract.getContractStats();
      expect(stats.totalPlayers).to.be.gte(1);
      expect(stats.gamesCompleted).to.be.gte(0);
    });

    it("Should get leaderboard info", async function () {
      const size = await contract.getLeaderboardSize();
      expect(size).to.be.gte(1);
      
      const firstPlayer = await contract.getLeaderboardPlayer(0);
      expect(firstPlayer).to.not.equal(ethers.ZeroAddress);
    });
  });

  describe("FHE Features (Read-only)", function () {
    it("Should have encrypted score for owner", async function () {
      const encryptedScore = await contract.getMyEncryptedScore();
      expect(encryptedScore).to.not.equal(0n);
    });

    it("Should have encrypted badges for owner", async function () {
      const encryptedBadges = await contract.getMyEncryptedBadges();
      expect(encryptedBadges).to.not.equal(0n);
    });

    it("Should have encrypted rank for owner", async function () {
      const encryptedRank = await contract.getMyEncryptedRank();
      expect(encryptedRank).to.not.equal(0n);
    });

    it("Owner can get player encrypted scores", async function () {
      const encryptedScore = await contract.getPlayerEncryptedScore(owner.address);
      expect(encryptedScore).to.not.equal(0n);
    });
  });

  describe("Active Game Info", function () {
    it("Should get active game info", async function () {
      const gameInfo = await contract.getActiveGameInfo(owner.address);
      // gameId could be 0 if no active game
      expect(gameInfo.gameId).to.be.gte(0);
    });
  });

  describe("Contract Balance", function () {
    it("Should report contract balance", async function () {
      const balance = await contract.getContractBalance();
      expect(balance).to.be.gte(0);
    });
  });
});
