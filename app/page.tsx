"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, 
CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { GalaxyConnection } from "@/lib/galaxy-connection"
import { PrisonBotLogic, type BotSettings } from "@/lib/prison-bot-logic"

export default function GalaxyPrisonBot() {
  const { toast } = useToast()

  /* ================= STATE ================= */

  const [isConnected, setIsConnected] = useState(false)
  const [botRunning, setBotRunning] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState("")
  const [planetName, setPlanetName] = useState("main")
  const [logs, setLogs] = useState<string[]>([])

  const [blackClan, setBlackClan] = useState("")
  const [blackNick, setBlackNick] = useState("")
  const [whiteClan, setWhiteClan] = useState("")
  const [whiteNick, setWhiteNick] = useState("")

  const [settings, setSettings] = useState<BotSettings>({
    prisonAll: true,
    userPart: true,
    timeout3Sec: true,
    disconnectAction: false,
    reconnect: true,
    standOnEnemy: false,
    prisonAndOff: false,
    reFlyJoin: false,
    timerReconnect: "0",
    attackMin: "1700",
    attackMax: "2000",
    attackPlusMinus: "5",
    defenseMin: "1600",
    defenseMax: "1600",
    defensePlusMinus: "5",
    pmTmA: false,
    pmTmZ: false,
  })

  /* ================= REFS ================= */

  const galaxyRef = useRef<GalaxyConnection | null>(null)
  const botLogicRef = useRef<PrisonBotLogic | null>(null)
  const botRunningRef = useRef(false)
  const settingsRef = useRef(settings)
  const filtersRef = useRef({
    blackClan: [] as string[],
    blackNick: [] as string[],
    whiteClan: [] as string[],
    whiteNick: [] as string[],
  })

  /* ================= LOGGING ================= */

  const addLog = useCallback((msg: string) => {
    const t = new Date().toLocaleTimeString()
    setLogs((p) => [...p, `[${t}] ${msg}`])
  }, [])

  /* ================= EFFECTS ================= */

  useEffect(() => {
    settingsRef.current = settings
    botLogicRef.current?.updateSettings(settings)
  }, [settings])

  useEffect(() => {
    filtersRef.current = {
      blackClan: blackClan.split("\n").filter(Boolean),
      blackNick: blackNick.split("\n").filter(Boolean),
      whiteClan: whiteClan.split("\n").filter(Boolean),
      whiteNick: whiteNick.split("\n").filter(Boolean),
    }
    botLogicRef.current?.updateFilters(filtersRef.current)
  }, [blackClan, blackNick, whiteClan, whiteNick])

  /* ================= INIT (ONE TIME) ================= */

  useEffect(() => {
    const galaxy = new GalaxyConnection()
    galaxyRef.current = galaxy

    galaxy.onLog((msg) => addLog(`[Storm-The Legend Killer] ${msg}`))

    galaxy.onConnected(() => {
      setIsConnected(true)
      toast({ title: "Connected" })
    })

    galaxy.onDisconnected(() => {
      setIsConnected(false)
      setBotRunning(false)
      botRunningRef.current = false
      toast({ title: "Disconnected", variant: "destructive" })
    })

    const bot = new PrisonBotLogic(settingsRef.current, filtersRef.current, galaxy)
    botLogicRef.current = bot

    return () => {
      galaxy.disconnect()
    }
  }, [addLog, toast])

  /* ================= ACTIONS ================= */

  const connectBot = () => {
    if (!recoveryCode.trim()) return
    galaxyRef.current?.connect(recoveryCode)
  }

  const disconnectBot = () => {
    galaxyRef.current?.disconnect()
    setBotRunning(false)
    botRunningRef.current = false
  }

  const startBot = () => {
    setBotRunning(true)
    botRunningRef.current = true
    addLog("Bot started")
  }

  const travelToPlanet = () => {
    galaxyRef.current?.joinPlanet(planetName)
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#12001f] to-[#0a0014] text-white p-4 flex items-center justify-center">
      <Toaster />

      <Card className="
  w-full max-w-md
  bg-gradient-to-br from-[#12001f]/90 via-[#1a002e]/90 to-[#050008]/90
  backdrop-blur-xl
  border border-purple-500/30
  shadow-[0_0_60px_rgba(168,85,247,0.35)]
  rounded-2xl
">
         <CardHeader className="text-center">
  <CardHeader className="text-center">
  <CardTitle
    className="
      text-4xl font-extrabold tracking-widest
      bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400
      bg-clip-text text-transparent
      drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]
    "
  >
    {"Storm-The Legend Killer"}
  </CardTitle>

  <CardDescription className="text-sm text-purple-300 tracking-widest">
    {"project by "}
    <span className="text-pink-400 font-semibold">AWARA_HUN</span>
  </CardDescription>
</CardHeader>

        <CardContent>
          <Input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="Recovery code" />
          <Button
  onClick={connectBot}
  disabled={isConnected}
  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 shadow-lg shadow-purple-500/40 transition-all"
>
  Connect
</Button>
          <Button
  onClick={disconnectBot}
  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/40 transition-all"
>
  Disconnect
</Button>

          <Input value={planetName} onChange={(e) => setPlanetName(e.target.value)} placeholder="Planet" />
          <Button
  onClick={travelToPlanet}
  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-cyan-500/40 transition-all"
>
  Travel
</Button>

          <Button
  onClick={startBot}
  disabled={!isConnected || botRunning}
  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/40 transition-all disabled:opacity-50"
>
  Start Bot
</Button>

          <div className="flex justify-between mt-4 text-sm">
  <div className="flex items-center gap-2">
    <span
      className={`h-3 w-3 rounded-full ${
        isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
      }`}
    />
    <span className="text-gray-300">
      {isConnected ? "Connected" : "Disconnected"}
    </span>
  </div>

  <div className="flex items-center gap-2">
    <span
      className={`h-3 w-3 rounded-full ${
        botRunning ? "bg-yellow-400 animate-pulse" : "bg-gray-500"
      }`}
    />
    <span className="text-gray-300">
      {botRunning ? "Bot Armed" : "Bot Idle"}
    </span>
  </div>
</div>
  {/* ============== STORM LOG CONSOLE ============== */}
<div className="mt-6">
  <div className="mb-2 flex items-center justify-between">
    <span className="text-sm font-semibold text-purple-400 tracking-wider">
      ⚡ STORM CONSOLE
    </span>

    <button
      onClick={() => setLogs([])}
      className="text-xs text-red-400 hover:text-red-300 transition"
    >
      Clear
    </button>
  </div>

  <div
    className="
      h-52 overflow-y-auto rounded-xl
      bg-black/70 backdrop-blur
      border border-purple-500/30
      shadow-[0_0_25px_rgba(168,85,247,0.25)]
      p-3
      text-xs font-mono
      text-green-400
    "
  >
    {logs.length === 0 ? (
      <div className="text-gray-500 italic">
        Waiting for storm activity...
      </div>
    ) : (
      logs.map((log, i) => (
        <div
          key={i}
          className="mb-1 leading-snug"
          dangerouslySetInnerHTML={{ __html: log }}
        />
      ))
    )}
  </div>
</div>
</div>
</div>
)
}




