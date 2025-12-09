"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

interface WalletOption {
  id: string
  name: string
  icon: string
  description: string
  installed?: boolean
}

interface WalletSelectorProps {
  onConnect: (address: string, provider: string) => void
  trigger?: React.ReactNode
}

export default function WalletSelector({ onConnect, trigger }: WalletSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const walletOptions: WalletOption[] = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "🦊",
      description: "Most popular Ethereum wallet",
      installed: typeof window !== "undefined" && Boolean(window.ethereum?.isMetaMask),
    },
    {
      id: "okx",
      name: "OKX Wallet",
      icon: "⭕",
      description: "Multi-chain wallet from OKX",
      installed: typeof window !== "undefined" && Boolean(window.okxwallet || window.ethereum?.isOkxWallet),
    },
    {
      id: "rabby",
      name: "Rabby Wallet",
      icon: "🐰",
      description: "Better Web3 wallet for DeFi users",
      installed: typeof window !== "undefined" && Boolean(window.rabby || window.ethereum?.isRabby),
    },
    {
      id: "phantom",
      name: "Phantom Wallet",
      icon: "👻",
      description: "Multi-chain wallet (Solana + EVM)",
      installed: typeof window !== "undefined" && Boolean(window.phantom?.ethereum),
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      icon: "🔵",
      description: "Connect using Coinbase Wallet",
      installed: typeof window !== "undefined" && Boolean(window.ethereum?.isCoinbaseWallet),
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: "🔗",
      description: "Connect via QR code (mobile wallets)",
      installed: true, // Always available
    },
  ]

  const connectWallet = async (walletId: string) => {
    setLoading(walletId)

    try {
      let provider: any

      // Select provider based on wallet type
      if (walletId === "metamask") {
        if (window.ethereum?.providers) {
          provider = window.ethereum.providers.find((p: any) => p.isMetaMask)
        } else if (window.ethereum?.isMetaMask) {
          provider = window.ethereum
        }
        if (!provider) {
          alert("Please install MetaMask")
          setLoading(null)
          return
        }
      } else if (walletId === "okx") {
        if (window.okxwallet) {
          provider = window.okxwallet
        } else if (window.ethereum?.isOkxWallet) {
          provider = window.ethereum
        }
        if (!provider) {
          alert("Please install OKX Wallet")
          window.open("https://www.okx.com/web3", "_blank")
          setLoading(null)
          return
        }
      } else if (walletId === "rabby") {
        if (window.rabby) {
          provider = window.rabby
        } else if (window.ethereum?.isRabby) {
          provider = window.ethereum
        }
        if (!provider) {
          alert("Please install Rabby Wallet")
          window.open("https://rabby.io/", "_blank")
          setLoading(null)
          return
        }
      } else if (walletId === "phantom") {
        if (window.phantom?.ethereum) {
          provider = window.phantom.ethereum
        }
        if (!provider) {
          alert("Please install Phantom Wallet")
          window.open("https://phantom.app/", "_blank")
          setLoading(null)
          return
        }
      } else if (walletId === "coinbase") {
        if (window.ethereum?.providers) {
          provider = window.ethereum.providers.find((p: any) => p.isCoinbaseWallet)
        } else if (window.ethereum?.isCoinbaseWallet) {
          provider = window.ethereum
        }
        if (!provider) {
          alert("Please install Coinbase Wallet")
          window.open("https://www.coinbase.com/wallet", "_blank")
          setLoading(null)
          return
        }
      } else if (walletId === "walletconnect") {
        alert("WalletConnect integration coming soon!")
        setLoading(null)
        return
      }

      if (!provider) {
        alert("Wallet not found")
        setLoading(null)
        return
      }

      // Request account access
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      })

      // Check and switch to Sepolia
      const chainId = await provider.request({ method: "eth_chainId" })
      const sepoliaChainId = "0xaa36a7" // 11155111

      if (chainId !== sepoliaChainId) {
        try {
          await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: sepoliaChainId }],
          })
        } catch (switchError: any) {
          // Chain not added, try to add it
          if (switchError.code === 4902) {
            await provider.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: sepoliaChainId,
                  chainName: "Sepolia Testnet",
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            })
          } else {
            throw switchError
          }
        }
      }

      // Successfully connected
      onConnect(accounts[0], walletId)
      setOpen(false)
    } catch (error: any) {
      console.error("Connection error:", error)
      if (error.code === -32002) {
        alert("Please check your wallet - there may be a pending connection request")
      } else if (error.code === 4001) {
        // User rejected
        console.log("User rejected connection")
      } else {
        alert("Failed to connect wallet: " + (error.message || "Unknown error"))
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Connect Wallet</DialogTitle>
          <DialogDescription className="text-slate-400">
            Choose your preferred wallet to connect to Knights Tour Z
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => connectWallet(wallet.id)}
              disabled={!wallet.installed || loading !== null}
              className={`
                flex items-center gap-4 p-4 rounded-lg border transition-all
                ${
                  wallet.installed
                    ? "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50 cursor-pointer"
                    : "border-slate-800 bg-slate-950/50 cursor-not-allowed opacity-50"
                }
                ${loading === wallet.id ? "border-cyan-500 bg-slate-800" : ""}
              `}
            >
              <div className="text-3xl">{wallet.icon}</div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{wallet.name}</h3>
                  {!wallet.installed && (
                    <span className="text-xs px-2 py-0.5 bg-slate-700 text-slate-400 rounded">
                      Not Detected
                    </span>
                  )}
                  {loading === wallet.id && (
                    <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">
                      Connecting...
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">{wallet.description}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800">
          Make sure you're on Sepolia testnet
        </div>
      </DialogContent>
    </Dialog>
  )
}
