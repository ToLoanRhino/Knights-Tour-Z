"use client"

import { useEffect, useState } from "react"

interface ProfileProps {
  address: string
  plays: number
  totalWins: number
  totalGamesPlayed: number
}

// Badge definitions based on win count
const BADGES = [
  { id: 1, name: "First Knight", icon: "🏆", wins: 1, desc: "Win your first game" },
  { id: 2, name: "Rising Star", icon: "⭐", wins: 3, desc: "Win 3 games" },
  { id: 3, name: "Knight Captain", icon: "🛡️", wins: 5, desc: "Win 5 games" },
  { id: 4, name: "Knight Commander", icon: "⚔️", wins: 10, desc: "Win 10 games" },
  { id: 5, name: "Grand Master", icon: "👑", wins: 25, desc: "Win 25 games" },
  { id: 6, name: "Legend", icon: "🌟", wins: 50, desc: "Win 50 games" },
]

export default function Profile({ address, plays, totalWins, totalGamesPlayed }: ProfileProps) {
  // Calculate win rate
  const winRate = totalGamesPlayed > 0 
    ? Math.round((totalWins / totalGamesPlayed) * 100) 
    : 0

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 rounded-xl p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Player Profile</h2>
            <p className="text-slate-400 font-mono">{address}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">Remaining Plays</p>
            <p className="text-5xl font-bold text-cyan-400">{plays}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <p className="text-slate-400 text-sm mb-2">Available Plays</p>
          <p className="text-3xl font-bold text-white">{plays}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <p className="text-slate-400 text-sm mb-2">Games Played</p>
          <p className="text-3xl font-bold text-white">{totalGamesPlayed}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <p className="text-slate-400 text-sm mb-2">Games Won</p>
          <p className="text-3xl font-bold text-green-400">{totalWins}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <p className="text-slate-400 text-sm mb-2">Win Rate</p>
          <p className="text-3xl font-bold text-amber-400">{winRate}%</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Achievement Badges</h3>
          <div className="text-sm text-slate-400">
            Unlocked: <span className="text-cyan-400 font-bold">
              {BADGES.filter(b => totalWins >= b.wins).length}
            </span> / {BADGES.length}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BADGES.map((badge) => {
            const isUnlocked = totalWins >= badge.wins
            const progress = Math.min((totalWins / badge.wins) * 100, 100)
            
            return (
              <div
                key={badge.id}
                className={`rounded-xl p-4 text-center transition-all ${
                  isUnlocked
                    ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/50"
                    : "bg-slate-700/30 border border-slate-600"
                }`}
              >
                <div className={`text-4xl mb-2 ${!isUnlocked && "grayscale opacity-50"}`}>
                  {isUnlocked ? badge.icon : "🔒"}
                </div>
                <h4 className={`text-sm font-bold mb-1 ${isUnlocked ? "text-white" : "text-slate-400"}`}>
                  {badge.name}
                </h4>
                <p className="text-slate-500 text-xs mb-2">{badge.desc}</p>
                
                {isUnlocked ? (
                  <span className="inline-block px-2 py-1 bg-amber-500/20 text-amber-400 text-xs font-bold rounded">
                    ✓ UNLOCKED
                  </span>
                ) : (
                  <div className="mt-2">
                    <div className="w-full bg-slate-700 rounded-full h-1.5 mb-1">
                      <div 
                        className="bg-cyan-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{totalWins}/{badge.wins} wins</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
