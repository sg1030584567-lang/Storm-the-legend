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

  /* ================= INIT ================= */

  useEffect(() => {
    const galaxy = new GalaxyConnection()
    galaxyRef.current = galaxy

    galaxy.onLog((msg) => addLog(msg))

    galaxy.onConnected(() => {
      setIsConnected(true)
      toast({ title: "Connected to Galaxy" })
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
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-purple-950 text-white p-4">
      <Toaster />

      <div className="mx-auto max-w-2xl">
        <Card className="border-purple-500/30 bg-black/70 backdrop-blur-xl shadow-[0_0_60px_rgba(168,85,247,0.25)]">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Storm-The Legend Killer
            </CardTitle>
{/* ========== STORM AVATAR (BOT STATE SYNCED) ========== */}
<div className="flex justify-center mt-6 mb-8 relative z-10">
  <div className="relative w-28 h-28 flex items-center justify-center">

    {/* Outer rotating ring */}
    <div
      className={`
        absolute inset-0 rounded-full border-2 animate-spin
        ${
          !isConnected
            ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]"
            : botRunning
            ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.9)]"
            : "border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.8)]"
        }
      `}
    />

    {/* Inner pulse ring */}
    <div
      className={`
        absolute inset-1 rounded-full border animate-pulse
        ${
          !isConnected
            ? "border-red-400/40"
            : botRunning
            ? "border-green-400/50"
            : "border-yellow-400/40"
        }
      `}
    />

    {/* Avatar */}
    <img
      src="https://i.pravatar.cc/150?img=32"
      alt="Storm Avatar"
      className="w-20 h-20 rounded-full z-10 bg-black border-2 border-black"
    />

    {/* Status dot */}
    <span
      className={`
        absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-black
        animate-pulse
        ${
          !isConnected
            ? "bg-red-500"
            : botRunning
            ? "bg-green-500"
            : "bg-yellow-400"
        }
      `}
    />
  </div>
</div>
            <CardDescription className="text-gray-400">
              project by AWARA_HUN
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="main">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
                <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
              </TabsList>

              {/* ================= MAIN ================= */}
              <TabsContent value="main" className="space-y-4">
                <Label>Recovery Code</Label>
                <Input value={recoveryCode} onChange={(e) => setRecoveryCode(e.target.value)} />

                <div className="flex gap-2">
                  <Button onClick={connectBot} disabled={isConnected}>Connect</Button>
                  <Button onClick={disconnectBot} variant="destructive">Disconnect</Button>
                </div>

                <Label>Planet</Label>
                <Input value={planetName} onChange={(e) => setPlanetName(e.target.value)} />
                <Button onClick={travelToPlanet} disabled={!isConnected}>Travel</Button>

                <Button onClick={startBot} disabled={!isConnected || botRunning} className="w-full bg-green-600">
                  Start Bot
                </Button>

                {/* ============== STORM LOG CONSOLE ============== */}
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-400 tracking-wider">
                      ⚡ STORM CONSOLE
                    </span>
                    <button onClick={() => setLogs([])} className="text-xs text-red-400">
                      Clear
                    </button>
                  </div>

                  <div className="h-52 overflow-y-auto rounded-xl bg-black/70 border border-purple-500/30 p-3 text-xs font-mono text-green-400">
                    {logs.length === 0 ? (
                      <div className="text-gray-500 italic">
                        Waiting for storm activity...
                      </div>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} dangerouslySetInnerHTML={{ __html: log }} />
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* ================= BLACKLIST ================= */}
              <TabsContent value="blacklist">
                <Textarea value={blackClan} onChange={(e) => setBlackClan(e.target.value)} placeholder="Blacklisted clans" />
                <Textarea value={blackNick} onChange={(e) => setBlackNick(e.target.value)} placeholder="Blacklisted nicks" />
              </TabsContent>

              {/* ================= WHITELIST ================= */}
              <TabsContent value="whitelist">
                <Textarea value={whiteClan} onChange={(e) => setWhiteClan(e.target.value)} placeholder="Whitelisted clans" />
                <Textarea value={whiteNick} onChange={(e) => setWhiteNick(e.target.value)} placeholder="Whitelisted nicks" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



