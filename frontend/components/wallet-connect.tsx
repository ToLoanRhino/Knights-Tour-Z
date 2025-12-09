"use client"

import WalletSelector from "./wallet-selector"

interface WalletConnectProps {
  onConnect?: (address: string, provider?: string) => void
  onDisconnect?: () => void
}

export default function WalletConnect({ onConnect, onDisconnect }: WalletConnectProps) {
  const handleConnect = (address: string, provider: string) => {
    console.log(`Connected with ${provider}:`, address)
    if (onConnect) {
      onConnect(address, provider)
    }
  }

  const disconnectWallet = () => {
    if (onDisconnect) {
      onDisconnect()
    }
  }

  // If onDisconnect is provided, this is a disconnect button (connected state)
  if (onDisconnect) {
    return (
      <button
        onClick={disconnectWallet}
        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg font-medium transition-colors"
      >
        Disconnect
      </button>
    )
  }

  // Otherwise, show wallet selector
  return <WalletSelector onConnect={handleConnect} />
}
