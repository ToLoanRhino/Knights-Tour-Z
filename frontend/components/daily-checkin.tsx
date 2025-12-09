"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { CONTRACT_CONFIG, CONTRACT_ABI } from "@/lib/contract"

interface DailyCheckinProps {
  address: string
  walletId?: string
  onPlaysUpdate: () => void
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

export default function DailyCheckin({ address, walletId, onPlaysUpdate }: DailyCheckinProps) {
  const [plays, setPlays] = useState(0)
  const [canCheckin, setCanCheckin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [lastCheckin, setLastCheckin] = useState<number>(0)
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)
  const [isRegistered, setIsRegistered] = useState(false)

  useEffect(() => {
    if (address) {
      fetchStatus()
    }
  }, [address, walletId])

  const fetchStatus = async () => {
    setChecking(true)
    try {
      const walletProvider = getWalletProvider(walletId)
      if (!walletProvider) {
        setChecking(false)
        return
      }
      
      const provider = new ethers.BrowserProvider(walletProvider)
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, provider)
      
      // Get player info
      const playerInfo = await contract.getPlayerInfo(address)
      const exists = playerInfo[4]
      setIsRegistered(exists)
      
      if (exists) {
        const availableTurns = Number(playerInfo[1])
        const lastCheckInTime = Number(playerInfo[0])
        const gamesPlayed = Number(playerInfo[3])
        
        setPlays(availableTurns)
        setLastCheckin(lastCheckInTime)
        setTotalGamesPlayed(gamesPlayed)
        
        // Check if can check in today
        try {
          const canCheck = await contract.canCheckInToday(address)
          setCanCheckin(canCheck)
        } catch {
          setCanCheckin(false)
        }
      } else {
        setPlays(0)
        setCanCheckin(false)
      }
    } catch (error) {
      console.error("Failed to fetch checkin status:", error)
    } finally {
      setChecking(false)
    }
  }

  const handleDailyCheckin = async () => {
    setLoading(true)
    try {
      const walletProvider = getWalletProvider(walletId)
      const provider = new ethers.BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)
      
      console.log("Checking in...")
      const tx = await contract.dailyCheckIn({ gasLimit: 100000 })
      console.log("Check-in tx:", tx.hash)
      await tx.wait()
      
      alert("Daily check-in successful! +3 turns")
      setCanCheckin(false)
      
      // Wait a bit for state to update, then refresh
      setTimeout(async () => {
        await fetchStatus()
        onPlaysUpdate()
      }, 1000)
    } catch (error: any) {
      console.error("Check-in error:", error)
      if (error.message?.includes("Already checked in")) {
        alert("You already checked in today!")
        setCanCheckin(false)
      } else {
        alert(`Check-in failed: ${error.shortMessage || error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Calculate next check-in time
  const getNextCheckinTime = () => {
    if (!lastCheckin) return null
    const nextTime = new Date((lastCheckin + 86400) * 1000) // Add 24 hours
    return nextTime
  }

  const nextCheckin = getNextCheckinTime()

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Daily Check-In</h2>
          <p className="text-slate-400">Earn 3 play tokens every 24 hours</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400 mb-1">Available Plays</p>
          <p className="text-3xl font-bold text-cyan-400">{checking ? "..." : plays}</p>
        </div>
      </div>

      {/* Stats Row */}
      {isRegistered && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">Games Played</p>
            <p className="text-lg font-bold text-white">{totalGamesPlayed}</p>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-3">
            <p className="text-xs text-slate-400">Status</p>
            <p className="text-lg font-bold text-green-400">✓ Registered</p>
          </div>
        </div>
      )}

      <button
        onClick={handleDailyCheckin}
        disabled={!canCheckin || loading || checking || !isRegistered}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          canCheckin && !loading && isRegistered
            ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white"
            : "bg-slate-700 text-slate-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Checking in..." : checking ? "Loading..." : !isRegistered ? "Register in Buy Plays →" : canCheckin ? "Check In Now (+3 Turns)" : "Already Checked In Today"}
      </button>

      {/* Next check-in time */}
      {!canCheckin && nextCheckin && isRegistered && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          Next check-in: {nextCheckin.toLocaleString()}
        </p>
      )}
    </div>
  )
}
