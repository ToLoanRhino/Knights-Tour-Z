"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { CONTRACT_CONFIG, CONTRACT_ABI } from "@/lib/contract"

interface GameBoardProps {
  address: string
  walletId?: string
  onComplete: (won: boolean) => void
  onBack: () => void
  onPlaysUpdate?: () => void
}

interface Position {
  row: number
  col: number
}

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

const knightMoves = [
  [2, 1],
  [2, -1],
  [-2, 1],
  [-2, -1],
  [1, 2],
  [1, -2],
  [-1, 2],
  [-1, -2],
]

export default function GameBoard({ address, walletId, onComplete, onBack, onPlaysUpdate }: GameBoardProps) {
  const [board, setBoard] = useState<(number | null)[][]>(
    Array(5)
      .fill(null)
      .map(() => Array(5).fill(null)),
  )
  const [visited, setVisited] = useState(0)
  const [currentPos, setCurrentPos] = useState<Position | null>(null)
  const [legalMoves, setLegalMoves] = useState<Position[]>([])
  const [gameComplete, setGameComplete] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [processing, setProcessing] = useState(false)

  const getLegalMoves = (pos: Position, visitedCells: Set<string>) => {
    const legal: Position[] = []
    for (const [dx, dy] of knightMoves) {
      const newRow = pos.row + dx
      const newCol = pos.col + dy
      if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5) {
        const key = `${newRow},${newCol}`
        if (!visitedCells.has(key)) {
          legal.push({ row: newRow, col: newCol })
        }
      }
    }
    return legal
  }

  const handleSquareClick = async (row: number, col: number) => {
    if (gameComplete || gameOver || processing) return

    if (!currentPos) {
      // Starting position
      const newBoard = board.map((r) => [...r])
      newBoard[row][col] = 1
      setBoard(newBoard)
      setCurrentPos({ row, col })
      setVisited(1)

      const visited_set = new Set([`${row},${col}`])
      const moves = getLegalMoves({ row, col }, visited_set)
      setLegalMoves(moves)
      
      // Check if stuck immediately (rare but possible)
      if (moves.length === 0 && 1 < 25) {
        setGameOver(true)
        setShowModal(true)
      }
    } else {
      // Check if it's a legal move
      const isLegal = legalMoves.some((m) => m.row === row && m.col === col)
      if (!isLegal) {
        alert("Illegal move! Choose a highlighted square.")
        return
      }

      // Make the move
      const newBoard = board.map((r) => [...r])
      const newVisited = visited + 1
      newBoard[row][col] = newVisited
      setBoard(newBoard)
      setCurrentPos({ row, col })
      setVisited(newVisited)

      // Check if game is complete (won!)
      if (newVisited === 25) {
        setGameComplete(true)
        setShowModal(true)
        // Don't return here - we'll claim win when user clicks "View Profile"
        return
      }

      // Update legal moves
      const visited_set = new Set<string>()
      newBoard.forEach((r, i) => {
        r.forEach((cell, j) => {
          if (cell !== null) visited_set.add(`${i},${j}`)
        })
      })
      const moves = getLegalMoves({ row, col }, visited_set)
      setLegalMoves(moves)
      
      // Check if stuck (Game Over)
      if (moves.length === 0) {
        setGameOver(true)
        setShowModal(true)
      }
    }
  }

  const [claimError, setClaimError] = useState<string | null>(null)

  // Claim win on contract - called when game is complete and user views profile
  const handleClaimWin = async () => {
    setProcessing(true)
    setClaimError(null)
    try {
      const walletProvider = getWalletProvider(walletId)
      const provider = new ethers.BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)
      
      console.log("Claiming win on contract (direct)...")
      // Use claimWinDirect() which bypasses on-chain move validation
      const tx = await contract.claimWinDirect({ gasLimit: 300000 })
      await tx.wait()
      
      console.log("Win claimed successfully!")
      onPlaysUpdate?.() // Refresh stats
      setShowModal(false)
      onComplete(true) // Navigate to profile
    } catch (error: any) {
      console.error("Claim win error:", error)
      // Keep modal open, show error, let user retry or exit
      setClaimError(error.shortMessage || error.message || "Unknown error")
    } finally {
      setProcessing(false)
    }
  }
  
  // Exit without claiming (user gives up on claim)
  const handleExitWithoutClaim = () => {
    setShowModal(false)
    setClaimError(null)
    onComplete(false) // Exit without claiming as win
  }

  // Reset local board state only (used after contract operations)
  const resetLocalBoard = () => {
    setBoard(
      Array(5)
        .fill(null)
        .map(() => Array(5).fill(null)),
    )
    setVisited(0)
    setCurrentPos(null)
    setLegalMoves([])
    setGameComplete(false)
    setGameOver(false)
  }

  // Reset Board - costs 1 play (forfeit current + start new)
  const handleReset = async () => {
    const confirmed = confirm(
      "🔄 Reset Board?\n\n" +
      "This will forfeit your current game and start a NEW game.\n" +
      "💰 Cost: 1 Play\n\n" +
      "Your current progress will be lost."
    )
    if (!confirmed) return
    
    setProcessing(true)
    try {
      const walletProvider = getWalletProvider(walletId)
      const provider = new ethers.BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)
      
      // Step 1: Forfeit current game
      console.log("Forfeiting current game...")
      const forfeitTx = await contract.forfeitGame({ gasLimit: 100000 })
      await forfeitTx.wait()
      
      // Step 2: Start new game (costs 1 play)
      console.log("Starting new game...")
      const startTx = await contract.startGame(0, { gasLimit: 150000 })
      await startTx.wait()
      
      console.log("New game started!")
      resetLocalBoard()
      onPlaysUpdate?.() // Refresh plays count
      
    } catch (error: any) {
      console.error("Reset error:", error)
      const errorMsg = (error.message || error.shortMessage || "").toLowerCase()
      
      // Check for "no turns" or "no plays" variations
      if (errorMsg.includes("no turns") || 
          errorMsg.includes("no available turns") || 
          errorMsg.includes("turns available") ||
          errorMsg.includes("not enough")) {
        alert(
          "⚠️ Out of Plays!\n\n" +
          "You don't have enough plays to start a new game.\n\n" +
          "Returning to Home to buy more plays or check-in."
        )
        onPlaysUpdate?.()
        onBack() // Go back to home
      } else {
        // Generic error - still offer to go home
        const goHome = confirm(
          `Reset failed: ${error.shortMessage || error.message}\n\n` +
          "Would you like to return to Home?"
        )
        if (goHome) {
          onPlaysUpdate?.()
          onBack()
        }
      }
    } finally {
      setProcessing(false)
    }
  }

  // Forfeit/Give up game - just exit (no extra cost, play was already used)
  const handleForfeit = async () => {
    const confirmed = confirm(
      "❌ Forfeit & Exit?\n\n" +
      "This will END your current game.\n" +
      "The play you used to start this game is already spent.\n\n" +
      "You will return to the home screen."
    )
    if (!confirmed) return
    
    setProcessing(true)
    try {
      const walletProvider = getWalletProvider(walletId)
      const provider = new ethers.BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)
      
      console.log("Forfeiting game...")
      const tx = await contract.forfeitGame({ gasLimit: 100000 })
      await tx.wait()
      
      // Check remaining plays
      const playerInfo = await contract.getPlayerInfo(address)
      const remainingPlays = Number(playerInfo[1])
      
      onPlaysUpdate?.() // Refresh plays count
      
      if (remainingPlays === 0) {
        alert(
          "🏠 Returning Home\n\n" +
          "You have 0 plays remaining.\n" +
          "Buy more plays or check-in daily to continue playing!"
        )
      }
      
      onBack()
    } catch (error: any) {
      console.error("Forfeit error:", error)
      const errorMsg = (error.message || error.shortMessage || "").toLowerCase()
      
      // Check for "no active game" or similar
      if (errorMsg.includes("no active") || errorMsg.includes("not in progress")) {
        alert(
          "🏠 No Active Game\n\n" +
          "You don't have an active game to forfeit.\n\n" +
          "Returning to Home."
        )
        onPlaysUpdate?.()
        onBack()
      } else {
        // Generic error - offer to go home
        const goHome = confirm(
          `Forfeit failed: ${error.shortMessage || error.message}\n\n` +
          "Would you like to return to Home anyway?"
        )
        if (goHome) {
          onPlaysUpdate?.()
          onBack()
        }
      }
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2">Knight's Tour 5×5</h2>
          <p className="text-slate-400">
            Moves: <span className="text-cyan-400 font-bold">{visited}</span> / 25
          </p>
        </div>

        {/* Game Board */}
        <div className="mb-8 flex justify-center">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <div className="grid grid-cols-5 gap-1 bg-slate-950 p-2 rounded">
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const isCurrentPos = currentPos?.row === r && currentPos?.col === c
                  const isLegalMove = legalMoves.some((m) => m.row === r && m.col === c)
                  const isEmpty = cell === null

                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => handleSquareClick(r, c)}
                      className={`w-16 h-16 rounded-lg font-bold text-lg transition-all ${
                        isCurrentPos
                          ? "bg-gradient-to-br from-cyan-500 to-blue-500 text-white scale-105 shadow-lg"
                          : isLegalMove
                            ? "bg-yellow-400/50 hover:bg-yellow-400/70 text-white border-2 border-yellow-400"
                            : cell !== null
                              ? "bg-slate-700 text-slate-300 cursor-default"
                              : "bg-slate-800 hover:bg-slate-700 text-slate-500"
                      } ${isEmpty && !isLegalMove ? "cursor-pointer" : ""}`}
                      disabled={!isEmpty && !isLegalMove}
                    >
                      {cell !== null && <span className="text-white font-bold">{cell}</span>}
                    </button>
                  )
                }),
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Info banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-300">
              🔄 <strong>Reset Board</strong> = Start fresh (costs 1 play)
              <br />
              ❌ <strong>Forfeit & Exit</strong> = Give up and return home
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              disabled={processing}
              className="flex-1 px-6 py-2 bg-amber-600/50 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {processing ? "Processing..." : "🔄 Reset Board (-1 Play)"}
            </button>
            <button
              onClick={handleForfeit}
              disabled={processing}
              className="flex-1 px-6 py-2 bg-red-600/50 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {processing ? "Processing..." : "❌ Forfeit & Exit"}
            </button>
          </div>
        </div>
      </div>

      {/* Completion/Game Over Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md mx-4 text-center">
            {gameComplete ? (
              <>
                <div className="text-6xl mb-4">🏅</div>
                <h3 className="text-2xl font-bold text-white mb-2">Congratulations!</h3>
                <p className="text-slate-400 mb-6">
                  You completed the Knight's Tour! Badge awarded for your first completion.
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">😔</div>
                <h3 className="text-2xl font-bold text-red-400 mb-2">Game Over!</h3>
                <p className="text-slate-400 mb-6">
                  No more valid moves available. You visited {visited} out of 25 squares.
                  <br />
                  <span className="text-sm text-slate-500">Tip: Try starting from a corner!</span>
                </p>
              </>
            )}
            {/* Error message if claim failed */}
            {claimError && gameComplete && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                <p className="text-red-400 text-sm font-medium mb-1">⚠️ Claim Failed</p>
                <p className="text-red-300 text-xs">{claimError}</p>
              </div>
            )}
            
            <div className="flex gap-3">
              {gameComplete ? (
                <>
                  {/* Retry Claim button */}
                  <button
                    onClick={handleClaimWin}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {processing ? "Claiming..." : claimError ? "🔄 Retry Claim" : "🏆 Claim Win"}
                  </button>
                  
                  {/* Exit without claiming - only show if there was an error */}
                  {claimError && (
                    <button
                      onClick={handleExitWithoutClaim}
                      disabled={processing}
                      className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      Exit (No Badge)
                    </button>
                  )}
                </>
              ) : (
                <>
                  {/* Game Over - Try Again */}
                  <button
                    onClick={async () => {
                      setShowModal(false)
                      await handleReset()
                    }}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {processing ? "..." : "Try Again (-1 Play)"}
                  </button>
                  
                  {/* Exit */}
                  <button
                    onClick={() => {
                      setShowModal(false)
                      onComplete(false)
                    }}
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    Exit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
