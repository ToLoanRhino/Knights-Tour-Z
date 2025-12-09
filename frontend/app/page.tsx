"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import WalletConnect from "@/components/wallet-connect"
import GameBoard from "@/components/game-board"
import Profile from "@/components/profile"
import DailyCheckin from "@/components/daily-checkin"
import BuyPlays from "@/components/buy-plays"
import { CONTRACT_CONFIG, CONTRACT_ABI } from "@/lib/contract"

// Helper to get the correct wallet provider
function getWalletProvider(walletId?: string): any {
  if (!walletId || walletId === "" || walletId === "metamask") {
    if (window.ethereum?.providers) {
      const mm = window.ethereum.providers.find((p: any) => p.isMetaMask && !p.isRabby && !p.isOkxWallet)
      if (mm) return mm
    }
    return window.ethereum
  }
  if (walletId === "okx") return (window as any).okxwallet || window.ethereum
  if (walletId === "rabby") return (window as any).rabby || window.ethereum
  if (walletId === "phantom") return (window as any).phantom?.ethereum || window.ethereum
  return window.ethereum
}

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [address, setAddress] = useState<string>("")
  const [walletId, setWalletId] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<"home" | "game" | "profile">("home")
  const [plays, setPlays] = useState(0)
  const [totalWins, setTotalWins] = useState(0)
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)
  const [gameInProgress, setGameInProgress] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch player info from contract
  const fetchPlayerInfo = useCallback(async (addr?: string, wId?: string) => {
    const playerAddr = addr || address
    const wallet = wId || walletId
    if (!playerAddr) return
    
    try {
      const walletProvider = getWalletProvider(wallet)
      if (!walletProvider) return
      
      const provider = new ethers.BrowserProvider(walletProvider)
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, provider)
      
      const playerInfo = await contract.getPlayerInfo(playerAddr)
      const availableTurns = Number(playerInfo[1])
      const gamesWon = Number(playerInfo[2]) // totalGamesWon
      const gamesPlayed = Number(playerInfo[3]) // totalGamesPlayed
      
      // Check if player has an active game
      const activeGame = await contract.getActiveGameInfo(playerAddr)
      const activeGameId = Number(activeGame[0])
      const gameCompleted = activeGame[2]
      const hasActive = activeGameId > 0 && !gameCompleted
      
      console.log("Player info fetched:", { availableTurns, gamesWon, gamesPlayed, hasActiveGame: hasActive })
      setPlays(availableTurns)
      setTotalWins(gamesWon)
      setTotalGamesPlayed(gamesPlayed)
      setGameInProgress(hasActive)
    } catch (error) {
      console.error("Failed to fetch player info:", error)
    }
  }, [address, walletId])

  useEffect(() => {
    checkWalletConnection()
  }, [])

  // Fetch player info when address changes
  useEffect(() => {
    if (address && connected) {
      fetchPlayerInfo(address, walletId)
    }
  }, [address, connected])

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setConnected(true)
          setAddress(accounts[0])
          // Detect wallet type
          if (window.ethereum?.isMetaMask) setWalletId("metamask")
          else if ((window as any).okxwallet) setWalletId("okx")
          else if ((window as any).rabby) setWalletId("rabby")
        }
      } catch (error) {
        console.error("Error checking wallet:", error)
      }
    }
  }

  const handleConnect = (addr: string, provider?: string) => {
    setConnected(true)
    setAddress(addr)
    setWalletId(provider || "")
    setCurrentPage("home")
    // Fetch player info after connect
    setTimeout(() => fetchPlayerInfo(addr, provider), 500)
  }

  const handleDisconnect = async () => {
    // If in game, need to forfeit first
    if (currentPage === "game" && gameInProgress) {
      const confirmed = confirm(
        "❌ Disconnect while in game?\n\n" +
        "This will FORFEIT your current game.\n" +
        "The play you used to start is already spent.\n\n" +
        "Continue?"
      )
      if (!confirmed) return
      
      try {
        const walletProvider = getWalletProvider(walletId)
        const provider = new ethers.BrowserProvider(walletProvider)
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)
        
        console.log("Forfeiting game before disconnect...")
        const tx = await contract.forfeitGame({ gasLimit: 100000 })
        await tx.wait()
      } catch (error) {
        console.error("Forfeit on disconnect error:", error)
      }
    }
    
    setConnected(false)
    setAddress("")
    setWalletId("")
    setCurrentPage("home")
    setGameInProgress(false)
  }

  const handleStartGame = async () => {
    // If game already in progress, just go to game page
    if (gameInProgress) {
      console.log("Continuing existing game...")
      setCurrentPage("game")
      return
    }
    
    if (plays <= 0) {
      alert("You need at least 1 play to start a game!")
      return
    }
    
    setLoading(true)
    try {
      const walletProvider = getWalletProvider(walletId)
      const provider = new ethers.BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)
      
      // Start game on contract - use position 0 (top-left)
      console.log("Starting game on contract...")
      const tx = await contract.startGame(0, { gasLimit: 150000 })
      await tx.wait()
      
      console.log("Game started!")
      setCurrentPage("game")
      setGameInProgress(true)
      
      // Refresh plays count
      await fetchPlayerInfo()
    } catch (error: any) {
      console.error("Failed to start game:", error)
      
      // Check if error is "Complete current game first" - means game exists
      const errorMsg = error.message || error.shortMessage || ""
      if (errorMsg.includes("Complete current game first") || 
          errorMsg.includes("Game already in progress")) {
        // Already has active game, just go to game page
        console.log("Active game detected, continuing...")
        setCurrentPage("game")
        setGameInProgress(true)
      } else if (errorMsg.toLowerCase().includes("no turns") || 
                 errorMsg.toLowerCase().includes("no available turns") ||
                 errorMsg.toLowerCase().includes("turns available")) {
        alert("You don't have enough plays! Buy or check-in first.")
      } else {
        alert(`Failed to start game: ${error.shortMessage || error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGameComplete = async (won: boolean) => {
    setGameInProgress(false)
    setCurrentPage("profile")
    if (won) {
      setTotalWins(prev => prev + 1)
    }
    // Refresh player info from contract
    await fetchPlayerInfo()
  }

  // Handle navigation - if in game, need to forfeit first
  const handleNavigation = async (target: "home" | "profile") => {
    // If currently in game, forfeit first
    if (currentPage === "game" && gameInProgress) {
      const confirmed = confirm(
        "❌ Leave game?\n\n" +
        "Leaving will FORFEIT your current game.\n" +
        "The play you used to start is already spent.\n\n" +
        "Continue?"
      )
      if (!confirmed) return
      
      // Forfeit the game
      try {
        setLoading(true)
        const walletProvider = getWalletProvider(walletId)
        const provider = new ethers.BrowserProvider(walletProvider)
        const signer = await provider.getSigner()
        const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)
        
        console.log("Forfeiting game before navigation...")
        const tx = await contract.forfeitGame({ gasLimit: 100000 })
        await tx.wait()
        
        setGameInProgress(false)
        await fetchPlayerInfo()
      } catch (error: any) {
        console.error("Forfeit error:", error)
        // Still navigate even if forfeit fails
      } finally {
        setLoading(false)
      }
    }
    
    setCurrentPage(target)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">♘</span>
            </div>
            <h1 className="text-xl font-bold text-white">Knights-Tour-Z</h1>
          </div>

          <nav className="flex items-center gap-4">
            {connected && currentPage !== "game" && (
              <>
                <button
                  onClick={() => handleNavigation("home")}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    currentPage === "home"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavigation("profile")}
                  disabled={loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    currentPage === "profile"
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Profile
                </button>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {connected ? (
              <>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Connected</p>
                  <p className="text-sm font-mono font-medium text-white">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                </div>
                <WalletConnect onDisconnect={handleDisconnect} />
              </>
            ) : (
              <WalletConnect onConnect={handleConnect} />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {!connected ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">♘</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">Knights-Tour-Z</h2>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                Complete the knight's tour on a 5×5 chessboard. Connect your wallet to play and earn badges.
              </p>
              <WalletConnect onConnect={handleConnect} />
            </div>
          </div>
        ) : currentPage === "game" ? (
          <GameBoard
            address={address}
            walletId={walletId}
            onComplete={handleGameComplete}
            onPlaysUpdate={() => fetchPlayerInfo()}
            onBack={() => {
              setCurrentPage("home")
              setGameInProgress(false)
              fetchPlayerInfo()
            }}
          />
        ) : currentPage === "profile" ? (
          <Profile address={address} plays={plays} totalWins={totalWins} totalGamesPlayed={totalGamesPlayed} />
        ) : (
          <div className="space-y-6">
            {/* Daily Check-in Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <DailyCheckin address={address} walletId={walletId} onPlaysUpdate={() => fetchPlayerInfo()} />
              </div>
              <div>
                <BuyPlays address={address} walletId={walletId} onPlaysUpdate={() => fetchPlayerInfo()} />
              </div>
            </div>

            {/* Game Start Section */}
            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Ready to Play?</h3>
                  <p className="text-slate-400">
                    Start your Knight's Tour and complete all 25 squares to earn a badge!
                  </p>
                </div>
                <button
                  onClick={handleStartGame}
                  disabled={(plays === 0 && !gameInProgress) || loading}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {loading ? "Starting..." : gameInProgress ? "Continue Game" : plays === 0 ? "Need Plays" : "Start Game"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer with contact information */}
      <footer className="bg-slate-950/80 backdrop-blur-sm border-t border-slate-700/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
          <p className="text-slate-400">
            <span className="text-slate-500">Discord:</span> <span className="text-slate-300 font-medium">zcarter</span>
          </p>
        </div>
      </footer>
    </div>
  )
}
