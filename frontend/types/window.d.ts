interface Window {
  ethereum?: {
    isMetaMask?: boolean
    isCoinbaseWallet?: boolean
    isRabby?: boolean
    isOkxWallet?: boolean
    providers?: any[]
    request: (args: { method: string; params?: any[] }) => Promise<any>
    on?: (event: string, callback: (...args: any[]) => void) => void
    removeListener?: (event: string, callback: (...args: any[]) => void) => void
  }
  okxwallet?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>
  }
  phantom?: {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isPhantom?: boolean
    }
  }
  rabby?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>
  }
}
