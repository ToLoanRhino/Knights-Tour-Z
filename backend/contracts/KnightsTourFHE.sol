// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Knights Tour Z - FHE Enhanced Version
/// @notice Game with encrypted leaderboard and hidden achievements
/// @dev Uses FHE for privacy features while keeping game logic in plaintext
/// @custom:fhe-features Encrypted scores, hidden achievements, private rankings
contract KnightsTourFHE is ZamaEthereumConfig {
    
    // ============ Constants ============
    uint256 public constant DAILY_FREE_TURNS = 3;
    uint256 public constant TURN_PRICE = 0.001 ether;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint8 public constant BOARD_SIZE = 5;
    uint256 public constant WIN_SCORE_BONUS = 100;
    uint256 public constant PERFECT_GAME_BONUS = 500; // 25 moves = perfect
    
    // ============ Player Structure ============
    /// @dev Player data - plaintext for operations, encrypted for privacy
    struct Player {
        // Plaintext game data (for reliable operations)
        uint256 lastCheckIn;
        uint32 availableTurns;
        uint32 totalGamesWon;
        uint32 totalGamesPlayed;
        uint32 totalScore;          // Cumulative score
        bool exists;
        
        // Encrypted privacy data (FHE)
        euint32 encryptedScore;     // Hidden from other players
        euint32 encryptedBadges;    // Achievement badges (hidden)
        euint32 encryptedRank;      // Private ranking position
    }
    
    /// @dev Game session structure
    struct GameSession {
        address player;
        uint256 startTime;
        uint8 moveCount;
        bool completed;
        bool won;
        mapping(uint8 => bool) visitedSquares;
    }
    
    // ============ State Variables ============
    mapping(address => Player) public players;
    mapping(address => uint256) public activeGameId;
    mapping(uint256 => GameSession) private games;
    uint256 private gameCounter;
    
    address public owner;
    uint256 public totalPrizePool;
    bool public paused;
    
    uint256 public totalPlayersRegistered;
    uint256 public totalGamesCompleted;
    
    // Leaderboard tracking (encrypted scores)
    address[] public leaderboardPlayers;
    mapping(address => bool) public isOnLeaderboard;
    
    // ============ Events ============
    event PlayerRegistered(address indexed player);
    event DailyCheckIn(address indexed player, uint256 timestamp, uint32 turnsReceived);
    event TurnsPurchased(address indexed player, uint32 amount, uint256 cost);
    event GameStarted(address indexed player, uint256 gameId, uint8 startPosition);
    event MoveMade(address indexed player, uint256 gameId, uint8 fromSquare, uint8 toSquare, uint8 moveNumber);
    event GameCompleted(address indexed player, uint256 gameId, bool won, uint8 totalMoves, uint32 scoreEarned);
    event BadgeAwarded(address indexed player, string badgeType);
    event ScoreEncrypted(address indexed player, bytes32 encryptedScoreHandle);
    event LeaderboardUpdated(address indexed player);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    
    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }
    
    modifier playerExists() {
        require(players[msg.sender].exists, "Player not registered");
        _;
    }
    
    modifier noActiveGame() {
        require(activeGameId[msg.sender] == 0, "Complete current game first");
        _;
    }
    
    modifier hasActiveGame() {
        require(activeGameId[msg.sender] != 0, "No active game");
        _;
    }
    
    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
    }
    
    // ============ Core Functions ============
    
    /// @notice Register a new player with encrypted initial stats
    function registerPlayer() external whenNotPaused {
        require(!players[msg.sender].exists, "Player already registered");
        
        // Create encrypted initial values
        euint32 zeroScore = FHE.asEuint32(0);
        euint32 zeroBadges = FHE.asEuint32(0);
        euint32 noRank = FHE.asEuint32(9999); // Default high rank
        
        // Allow player to decrypt their own data
        FHE.allow(zeroScore, msg.sender);
        FHE.allow(zeroBadges, msg.sender);
        FHE.allow(noRank, msg.sender);
        
        // Also allow contract owner for leaderboard management
        FHE.allow(zeroScore, owner);
        
        players[msg.sender] = Player({
            lastCheckIn: 0,
            availableTurns: 0,
            totalGamesWon: 0,
            totalGamesPlayed: 0,
            totalScore: 0,
            exists: true,
            encryptedScore: zeroScore,
            encryptedBadges: zeroBadges,
            encryptedRank: noRank
        });
        
        // Add to leaderboard tracking
        if (!isOnLeaderboard[msg.sender]) {
            leaderboardPlayers.push(msg.sender);
            isOnLeaderboard[msg.sender] = true;
        }
        
        totalPlayersRegistered++;
        emit PlayerRegistered(msg.sender);
        emit ScoreEncrypted(msg.sender, bytes32(euint32.unwrap(zeroScore)));
    }
    
    /// @notice Daily check-in to receive free turns
    function dailyCheckIn() external playerExists {
        Player storage player = players[msg.sender];
        
        require(
            block.timestamp >= player.lastCheckIn + SECONDS_PER_DAY,
            "Already checked in today"
        );
        
        player.lastCheckIn = block.timestamp;
        player.availableTurns += uint32(DAILY_FREE_TURNS);
        
        emit DailyCheckIn(msg.sender, block.timestamp, uint32(DAILY_FREE_TURNS));
    }
    
    /// @notice Purchase additional play turns
    function purchaseTurns(uint32 amount) external payable playerExists {
        require(amount > 0, "Amount must be greater than 0");
        uint256 cost = amount * TURN_PRICE;
        require(msg.value >= cost, "Insufficient payment");
        
        players[msg.sender].availableTurns += amount;
        totalPrizePool += msg.value;
        
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
        
        emit TurnsPurchased(msg.sender, amount, cost);
    }
    
    /// @notice Start a new game
    function startGame(uint8 startPosition) external playerExists noActiveGame whenNotPaused {
        require(startPosition < BOARD_SIZE * BOARD_SIZE, "Invalid start position");
        require(players[msg.sender].availableTurns > 0, "No turns available");
        
        gameCounter++;
        uint256 gameId = gameCounter;
        
        GameSession storage game = games[gameId];
        game.player = msg.sender;
        game.startTime = block.timestamp;
        game.moveCount = 1;
        game.completed = false;
        game.won = false;
        game.visitedSquares[startPosition] = true;
        
        activeGameId[msg.sender] = gameId;
        players[msg.sender].availableTurns--;
        players[msg.sender].totalGamesPlayed++;
        
        emit GameStarted(msg.sender, gameId, startPosition);
    }
    
    /// @notice Make a move
    function makeMove(uint8 fromSquare, uint8 toSquare) external playerExists hasActiveGame {
        uint256 gameId = activeGameId[msg.sender];
        GameSession storage game = games[gameId];
        
        require(!game.completed, "Game already completed");
        require(!game.visitedSquares[toSquare], "Square already visited");
        require(isValidKnightMove(fromSquare, toSquare), "Invalid knight move");
        
        game.visitedSquares[toSquare] = true;
        game.moveCount++;
        
        emit MoveMade(msg.sender, gameId, fromSquare, toSquare, game.moveCount);
    }
    
    /// @notice Claim win and update encrypted score
    function claimWin() external playerExists hasActiveGame {
        uint256 gameId = activeGameId[msg.sender];
        GameSession storage game = games[gameId];
        
        require(!game.completed, "Game already completed");
        
        uint8 visitedCount = 0;
        for (uint8 i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            if (game.visitedSquares[i]) {
                visitedCount++;
            }
        }
        
        require(visitedCount == BOARD_SIZE * BOARD_SIZE, "Not all squares visited");
        
        game.completed = true;
        game.won = true;
        
        // Calculate score
        uint32 scoreEarned = uint32(WIN_SCORE_BONUS);
        if (game.moveCount == 25) {
            scoreEarned += uint32(PERFECT_GAME_BONUS); // Perfect game bonus
        }
        
        // Update plaintext stats
        Player storage player = players[msg.sender];
        player.totalGamesWon++;
        player.totalScore += scoreEarned;
        
        // Update encrypted score (FHE)
        // Create new encrypted value from updated total
        euint32 newEncryptedScore = FHE.asEuint32(player.totalScore);
        FHE.allow(newEncryptedScore, msg.sender);
        FHE.allow(newEncryptedScore, owner);
        player.encryptedScore = newEncryptedScore;
        
        // Award badge for first win
        if (player.totalGamesWon == 1) {
            euint32 firstBadge = FHE.asEuint32(1);
            FHE.allow(firstBadge, msg.sender);
            player.encryptedBadges = firstBadge;
            emit BadgeAwarded(msg.sender, "FIRST_WIN");
        } else if (player.totalGamesWon == 10) {
            euint32 veteranBadge = FHE.asEuint32(2);
            FHE.allow(veteranBadge, msg.sender);
            player.encryptedBadges = veteranBadge;
            emit BadgeAwarded(msg.sender, "VETERAN");
        }
        
        activeGameId[msg.sender] = 0;
        totalGamesCompleted++;
        
        emit GameCompleted(msg.sender, gameId, true, game.moveCount, scoreEarned);
        emit ScoreEncrypted(msg.sender, bytes32(euint32.unwrap(newEncryptedScore)));
        emit LeaderboardUpdated(msg.sender);
    }
    
    /// @notice Forfeit game
    function forfeitGame() external playerExists hasActiveGame {
        uint256 gameId = activeGameId[msg.sender];
        GameSession storage game = games[gameId];
        
        require(!game.completed, "Game already completed");
        
        game.completed = true;
        game.won = false;
        activeGameId[msg.sender] = 0;
        totalGamesCompleted++;
        
        emit GameCompleted(msg.sender, gameId, false, game.moveCount, 0);
    }
    
    /// @notice Direct claim win (for demo - trusts frontend validation)
    /// @dev In production, this should verify moves on-chain
    function claimWinDirect() external playerExists hasActiveGame {
        uint256 gameId = activeGameId[msg.sender];
        GameSession storage game = games[gameId];
        
        require(!game.completed, "Game already completed");
        
        game.completed = true;
        game.won = true;
        game.moveCount = 25; // Assume perfect game for demo
        
        // Calculate score
        uint32 scoreEarned = uint32(WIN_SCORE_BONUS + PERFECT_GAME_BONUS);
        
        // Update plaintext stats
        Player storage player = players[msg.sender];
        player.totalGamesWon++;
        player.totalScore += scoreEarned;
        
        // Update encrypted score (FHE)
        euint32 newEncryptedScore = FHE.asEuint32(player.totalScore);
        FHE.allow(newEncryptedScore, msg.sender);
        FHE.allow(newEncryptedScore, owner);
        player.encryptedScore = newEncryptedScore;
        
        // Award badge for first win
        if (player.totalGamesWon == 1) {
            euint32 firstBadge = FHE.asEuint32(1);
            FHE.allow(firstBadge, msg.sender);
            player.encryptedBadges = firstBadge;
            emit BadgeAwarded(msg.sender, "FIRST_WIN");
        } else if (player.totalGamesWon == 10) {
            euint32 veteranBadge = FHE.asEuint32(2);
            FHE.allow(veteranBadge, msg.sender);
            player.encryptedBadges = veteranBadge;
            emit BadgeAwarded(msg.sender, "VETERAN");
        }
        
        activeGameId[msg.sender] = 0;
        totalGamesCompleted++;
        
        emit GameCompleted(msg.sender, gameId, true, 25, scoreEarned);
        emit ScoreEncrypted(msg.sender, bytes32(euint32.unwrap(newEncryptedScore)));
        emit LeaderboardUpdated(msg.sender);
    }
    
    // ============ FHE Privacy Functions ============
    
    /// @notice Get your own encrypted score handle (for decryption)
    /// @dev Only the player can decrypt this using their private key
    function getMyEncryptedScore() external view playerExists returns (euint32) {
        return players[msg.sender].encryptedScore;
    }
    
    /// @notice Get your own encrypted badges handle
    function getMyEncryptedBadges() external view playerExists returns (euint32) {
        return players[msg.sender].encryptedBadges;
    }
    
    /// @notice Get your encrypted rank
    function getMyEncryptedRank() external view playerExists returns (euint32) {
        return players[msg.sender].encryptedRank;
    }
    
    /// @notice Check if another player's score is higher than yours (encrypted comparison)
    /// @dev Returns encrypted boolean - only you can decrypt the result
    function isMyScoreHigherThan(address otherPlayer) external playerExists returns (ebool) {
        require(players[otherPlayer].exists, "Other player not registered");
        
        euint32 myScore = players[msg.sender].encryptedScore;
        euint32 theirScore = players[otherPlayer].encryptedScore;
        
        // FHE comparison - result is encrypted
        ebool result = FHE.gt(myScore, theirScore);
        FHE.allow(result, msg.sender);
        
        return result;
    }
    
    /// @notice Owner can get encrypted scores for ranking (privacy-preserving)
    function getPlayerEncryptedScore(address playerAddress) external view onlyOwner returns (euint32) {
        require(players[playerAddress].exists, "Player not registered");
        return players[playerAddress].encryptedScore;
    }
    
    /// @notice Update player's encrypted rank (owner only - after computing off-chain)
    function updatePlayerRank(address playerAddress, uint32 newRank) external onlyOwner {
        require(players[playerAddress].exists, "Player not registered");
        
        euint32 encryptedRank = FHE.asEuint32(newRank);
        FHE.allow(encryptedRank, playerAddress);
        FHE.allow(encryptedRank, owner);
        
        players[playerAddress].encryptedRank = encryptedRank;
    }
    
    // ============ View Functions ============
    
    /// @notice Check if move is valid knight move
    function isValidKnightMove(uint8 from, uint8 to) public pure returns (bool) {
        int8 fromRow = int8(from / BOARD_SIZE);
        int8 fromCol = int8(from % BOARD_SIZE);
        int8 toRow = int8(to / BOARD_SIZE);
        int8 toCol = int8(to % BOARD_SIZE);
        
        int8 rowDiff = fromRow > toRow ? fromRow - toRow : toRow - fromRow;
        int8 colDiff = fromCol > toCol ? fromCol - toCol : toCol - fromCol;
        
        return (rowDiff == 2 && colDiff == 1) || (rowDiff == 1 && colDiff == 2);
    }
    
    /// @notice Get player info (public data only)
    function getPlayerInfo(address playerAddress) external view returns (
        uint256 lastCheckIn,
        uint32 availableTurns,
        uint32 totalGamesWon,
        uint32 totalGamesPlayed,
        bool exists
    ) {
        Player storage player = players[playerAddress];
        return (
            player.lastCheckIn,
            player.availableTurns,
            player.totalGamesWon,
            player.totalGamesPlayed,
            player.exists
        );
    }
    
    /// @notice Check if player can check in
    function canCheckInToday(address playerAddress) external view returns (bool) {
        Player storage player = players[playerAddress];
        if (!player.exists) return false;
        return block.timestamp >= player.lastCheckIn + SECONDS_PER_DAY;
    }
    
    /// @notice Get active game info
    function getActiveGameInfo(address playerAddress) external view returns (
        uint256 gameId,
        uint8 moveCount,
        bool completed,
        bool won
    ) {
        gameId = activeGameId[playerAddress];
        if (gameId == 0) return (0, 0, false, false);
        
        GameSession storage game = games[gameId];
        return (gameId, game.moveCount, game.completed, game.won);
    }
    
    /// @notice Get contract stats
    function getContractStats() external view returns (
        uint256 totalPlayers,
        uint256 gamesCompleted,
        uint256 prizePool
    ) {
        return (totalPlayersRegistered, totalGamesCompleted, totalPrizePool);
    }
    
    /// @notice Get leaderboard size
    function getLeaderboardSize() external view returns (uint256) {
        return leaderboardPlayers.length;
    }
    
    /// @notice Get leaderboard player at index
    function getLeaderboardPlayer(uint256 index) external view returns (address) {
        require(index < leaderboardPlayers.length, "Index out of bounds");
        return leaderboardPlayers[index];
    }
    
    // ============ Admin Functions ============
    
    function pause() external onlyOwner { 
        paused = true; 
        emit ContractPaused(msg.sender); 
    }
    
    function unpause() external onlyOwner { 
        paused = false; 
        emit ContractUnpaused(msg.sender); 
    }
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        payable(owner).transfer(balance);
    }
    
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    function getContractBalance() external view returns (uint256) { 
        return address(this).balance; 
    }
}
