"use client"

import React from "react"

export type StormState =
  | "idle"
  | "connected"
  | "searching"
  | "locked"
  | "attacking"
  | "defending"

interface StormAvatarProps {
  state: StormState
}

export default function StormAvatar({ state }: StormAvatarProps) {
  const glowMap: Record<StormState, string> = {
    idle: "shadow-[0_0_20px_rgba(100,100,100,0.3)]",
    connected: "shadow-[0_0_25px_rgba(59,130,246,0.6)]",
    searching: "shadow-[0_0_30px_rgba(168,85,247,0.7)] animate-spin-slow",
    locked: "shadow-[0_0_35px_rgba(239,68,68,0.9)] animate-pulse",
    attacking: "shadow-[0_0_45px_rgba(255,0,0,1)] animate-flash",
    defending: "shadow-[0_0_35px_rgba(34,197,94,0.9)] animate-pulse",
  }

  const labelMap: Record<StormState, string> = {
    idle: "IDLE",
    connected: "CONNECTED",
    searching: "SEARCHING",
    locked: "TARGET LOCKED",
    attacking: "ATTACKING",
    defending: "DEFENDING",
  }

  return (
    <div className="flex flex-col items-center gap-2 my-6">
      <div
        className={`
          relative flex items-center justify-center
          w-28 h-28 rounded-full
          bg-gradient-to-br from-black via-gray-900 to-black
          border border-purple-500/40
          transition-all duration-300
          ${glowMap[state]}
        `}
      >
        <div className="absolute inset-2 rounded-full border border-purple-400/30" />
        <span className="text-2xl font-bold text-purple-300 select-none">
          ⚡
        </span>
      </div>

      <div className="text-xs tracking-widest text-purple-400 font-semibold">
        {labelMap[state]}
      </div>
    </div>
  )
}
