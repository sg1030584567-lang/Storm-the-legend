"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="min-h-screen bg-gradient-to-br from-black via-[#12001f] to-[#0a0014] text-white p-4">
      <Toaster />

      <Card>
         <CardHeader className="text-center">
  <CardTitle className="text-3xl font-extrabold tracking-wide">
    Storm-The Legend Killer
  </CardTitle>

  <CardDescription className="text-sm text-purple-300 tracking-widest">
    project by <span className="text-pink-400 font-semibold">AWARA_HUN</span>
  </CardDescription>
</CardHeader>

        <CardContent>
          <Input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} placeholder="Recovery code" />
          <Button onClick={connectBot} disabled={isConnected}>Connect</Button>
          <Button onClick={disconnectBot}>Disconnect</Button>

          <Input value={planetName} onChange={(e) => setPlanetName(e.target.value)} placeholder="Planet" />
          <Button onClick={travelToPlanet}>Travel</Button>

          <Button onClick={startBot} disabled={!isConnected || botRunning}>Start Bot</Button>

          <div className="mt-4 h-40 overflow-y-auto border p-2 text-sm">
            {logs.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
