"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { CONTRACT_CONFIG, CONTRACT_ABI } from "@/lib/contract"

interface BuyPlaysProps {
  address: string
  walletId?: string
  onPlaysUpdate: () => void
}

// Helper to get the correct wallet provider
function getWalletProvider(walletId?: string): any {
  if (!walletId || walletId === "" || walletId === "metamask") {
    // Try to find MetaMask specifically in providers array
    if (window.ethereum?.providers) {
      const mm = window.ethereum.providers.find((p: any) => p.isMetaMask && !p.isRabby && !p.isOkxWallet)
      if (mm) return mm
    }
    return window.ethereum
  }
  
  if (walletId === "okx") {
    return (window as any).okxwallet || window.ethereum
  }
  
  if (walletId === "rabby") {
    return (window as any).rabby || window.ethereum
  }
  
  if (walletId === "phantom") {
    return (window as any).phantom?.ethereum || window.ethereum
  }
  
  if (walletId === "coinbase") {
    if (window.ethereum?.providers) {
      const cb = window.ethereum.providers.find((p: any) => p.isCoinbaseWallet)
      if (cb) return cb
    }
    return window.ethereum
  }
  
  return window.ethereum
}

export default function BuyPlays({ address, walletId, onPlaysUpdate }: BuyPlaysProps) {
  const [amount, setAmount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const [currentPlays, setCurrentPlays] = useState(0)
  const pricePerPlay = 0.001 // ETH (from contract TURN_PRICE)

  // Auto-check registration on mount
  useEffect(() => {
    const provider = getWalletProvider(walletId)
    if (address && provider) {
      checkRegistration()
    }
  }, [address, walletId])

  // Check registration status
  const checkRegistration = async () => {
    const walletProvider = getWalletProvider(walletId)
    if (!walletProvider) return
    
    setChecking(true)
    try {
      const provider = new ethers.BrowserProvider(getWalletProvider(walletId))
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, provider)
      
      const playerInfo = await contract.getPlayerInfo(address)
      console.log("Player info:", {
        lastCheckIn: playerInfo[0].toString(),
        availableTurns: playerInfo[1].toString(),
        totalGamesWon: playerInfo[2].toString(),
        totalGamesPlayed: playerInfo[3].toString(),
        exists: playerInfo[4]
      })
      setIsRegistered(playerInfo[4])
      setCurrentPlays(Number(playerInfo[1]))
    } catch (error) {
      console.error("Failed to check registration:", error)
      setIsRegistered(false)
    } finally {
      setChecking(false)
    }
  }

  // Register player
  const handleRegister = async () => {
    const walletProvider = getWalletProvider(walletId)
    if (!walletProvider) {
      alert("Please install a Web3 wallet")
      return
    }

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_ABI, signer)

      console.log("Registering player with wallet:", walletId || "default")
      const tx = await contract.registerPlayer()
      console.log("Registration tx:", tx.hash)
      
      alert(`Registration submitted! Tx: ${tx.hash.slice(0, 10)}...`)
      await tx.wait()
      
      setIsRegistered(true)
      alert("Registration successful! You can now purchase turns.")
      
      // Refresh after registration
      setTimeout(() => {
        onPlaysUpdate()
      }, 1000)
    } catch (error: any) {
      console.error("Registration error:", error)
      if (error.message?.includes("already registered")) {
        setIsRegistered(true)
        alert("You are already registered!")
      } else if (error.code === 4001) {
        alert("Transaction rejected")
      } else {
        alert(`Registration failed: ${error.message || "Unknown error"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Purchase turns only - simple version for fixed contract
  const handleBuyPlays = async () => {
    const walletProvider = getWalletProvider(walletId)
    if (!walletProvider) {
      alert("Please install a Web3 wallet")
      return
    }

    setLoading(true)
    try {
      const provider = new ethers.BrowserProvider(walletProvider)
      const signer = await provider.getSigner()
      
      const contract = new ethers.Contract(
        CONTRACT_CONFIG.address,
        CONTRACT_ABI,
        signer
      )
      
      const cost = ethers.parseEther((amount * pricePerPlay).toString())
      
      console.log("=== Purchase Turns ===")
      console.log("Wallet:", walletId || "default")
      console.log("Contract:", CONTRACT_CONFIG.address)
      console.log("Amount:", amount)
      console.log("Cost:", ethers.formatEther(cost), "ETH")
      
      const tx = await contract.purchaseTurns(amount, {
        value: cost,
        gasLimit: 100000
      })
      
      console.log("TX hash:", tx.hash)
      alert(`Transaction submitted! Tx: ${tx.hash.slice(0, 10)}...`)
      
      const receipt = await tx.wait()
      console.log("Receipt:", receipt)
      
      if (receipt?.status === 1) {
        setAmount(1)
        alert(`Successfully purchased ${amount} play(s)!`)
        
        // Wait a bit for blockchain state to update, then refresh
        setTimeout(async () => {
          await checkRegistration() // This fetches updated plays too
          onPlaysUpdate()
        }, 1500)
      } else {
        throw new Error("Transaction failed")
      }
      
    } catch (error: any) {
      console.error("Purchase error:", error)
      
      if (error.code === 4001) {
        alert("Transaction rejected by user")
      } else if (error.message?.includes("Player not registered")) {
        setIsRegistered(false)
        alert("You need to register first!")
      } else {
        alert(`Purchase failed: ${error.shortMessage || error.message || "Unknown error"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = (amount * pricePerPlay).toFixed(3)

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">Buy Plays</h3>
        {isRegistered && (
          <div className="text-right">
            <p className="text-xs text-slate-400">Current</p>
            <p className="text-lg font-bold text-cyan-400">{currentPlays}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Registration Status */}
        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-400">Registration Status</span>
            {checking ? (
              <span className="text-xs text-slate-400">Checking...</span>
            ) : isRegistered === null ? (
              <button
                onClick={checkRegistration}
                className="text-xs text-cyan-400 hover:text-cyan-300"
              >
                Check Status
              </button>
            ) : isRegistered ? (
              <span className="text-sm text-green-400">✓ Registered</span>
            ) : (
              <button
                onClick={handleRegister}
                disabled={loading}
                className="text-xs px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded font-semibold"
              >
                {loading ? "Registering..." : "⚡ Register Now"}
              </button>
            )}
          </div>
          {isRegistered === false && (
            <p className="text-xs text-yellow-400 mt-2">⚠️ You must register before purchasing turns!</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Number of Plays</label>
          <input
            type="number"
            min="1"
            max="100"
            value={amount}
            onChange={(e) => setAmount(Number.parseInt(e.target.value) || 1)}
            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-3">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Price per play</span>
            <span className="text-white">{pricePerPlay} ETH</span>
          </div>
          <div className="flex justify-between font-bold">
            <span className="text-cyan-400">Total</span>
            <span className="text-cyan-400">{totalPrice} ETH</span>
          </div>
        </div>

        <button
          onClick={handleBuyPlays}
          disabled={loading || amount < 1 || isRegistered === false}
          className="w-full py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? "Processing..." : isRegistered === false ? "Register First ↑" : "Buy Plays"}
        </button>
      </div>
    </div>
  )
}
