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

// ============== CONNECTION HANDLERS ==============

const connectionRef = useRef<GalaxyConnection | null>(null)
const botRef = useRef<PrisonBotLogic | null>(null)

const connect = async () => {
  if (isConnected) return

  try {
    const conn = new GalaxyConnection({
      onLog: (msg: string) =>
        setLogs((l) => [...l, `[CONNECT] ${msg}`]),
    })

    await conn.connect(recoveryCode)

    connectionRef.current = conn
    setIsConnected(true)

    botRef.current = new PrisonBotLogic(conn, settings, {
      onLog: (msg) => setLogs((l) => [...l, msg]),
    })

    toast({ title: "Connected to Galaxy" })
  } catch (e: any) {
    toast({ title: "Connection failed", description: e?.message })
  }
}

const disconnect = () => {
  botRef.current?.stop()
  connectionRef.current?.disconnect()

  botRef.current = null
  connectionRef.current = null

  setBotRunning(false)
  setIsConnected(false)

  toast({ title: "Disconnected" })
}

const startBot = () => {
  if (!botRef.current) return

  botRef.current.start({
    planet: planetName,
    blacklist: { clan: blackClan, nick: blackNick },
    whitelist: { clan: whiteClan, nick: whiteNick },
  })

  setBotRunning(true)
  toast({ title: "Bot started" })
}

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
  <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-4">
    <Toaster />

    {/* ===== HEADER ===== */}
    <h1 className="text-3xl font-extrabold text-center text-purple-400 mb-1 tracking-wide">
      Storm-The Legend Killer
    </h1>
    <p className="text-center text-gray-400 mb-6 text-sm">
      project by AWARA_HUN
    </p>

    <div className="mx-auto max-w-2xl">
      <Card className="bg-black/70 border border-purple-500/30 backdrop-blur shadow-[0_0_40px_rgba(168,85,247,0.25)]">
        <CardContent className="space-y-6 pt-6">

          {/* ===== STORM AVATAR (STATE SYNCED) ===== */}
          <div className="flex justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full border-2 animate-spin
                  ${
                    !isConnected
                      ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.8)]"
                      : botRunning
                      ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.9)]"
                      : "border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.9)]"
                  }
                `}
              />
              <div
                className={`w-14 h-14 rounded-full animate-pulse
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

          {/* ===== STATUS ROW ===== */}
          <div className="flex justify-between text-sm text-gray-300">
            <span>
              Connection:{" "}
              <b className={isConnected ? "text-green-400" : "text-red-400"}>
                {isConnected ? "Connected" : "Disconnected"}
              </b>
            </span>
            <span>
              Bot:{" "}
              <b className={botRunning ? "text-green-400" : "text-gray-400"}>
                {botRunning ? "Armed" : "Idle"}
              </b>
            </span>
          </div>

          {/* ===== TABS ===== */}
          <Tabs defaultValue="main">
            <TabsList className="grid grid-cols-4 bg-zinc-900">
              <TabsTrigger value="main">Main</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
              <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
            </TabsList>

            {/* ===== MAIN TAB ===== */}
            <TabsContent value="main" className="space-y-4">
              <div>
                <Label>Recovery Code</Label>
                <Input
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={connect} disabled={isConnected}>
                  Connect
                </Button>
                <Button
                  variant="destructive"
                  onClick={disconnect}
                  disabled={!isConnected}
                >
                  Disconnect
                </Button>
              </div>

              <div>
                <Label>Planet</Label>
                <Input
                  value={planetName}
                  onChange={(e) => setPlanetName(e.target.value)}
                />
                <Button
                  className="mt-2"
                  onClick={travelToPlanet}
                  disabled={!isConnected}
                >
                  Travel
                </Button>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={startBot}
                disabled={!isConnected}
              >
                Start Bot
              </Button>
            </TabsContent>

            {/* ===== SETTINGS ===== */}
            <TabsContent value="settings">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.prisonAll}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, prisonAll: v })
                    }
                  />
                  <span>Prison All</span>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={settings.reconnect}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, reconnect: v })
                    }
                  />
                  <span>Auto Reconnect</span>
                </div>
              </div>
            </TabsContent>

            {/* ===== BLACKLIST ===== */}
            <TabsContent value="blacklist" className="space-y-2">
              <Textarea
                placeholder="Blacklisted clans"
                value={blackClan}
                onChange={(e) => setBlackClan(e.target.value)}
              />
              <Textarea
                placeholder="Blacklisted nicks"
                value={blackNick}
                onChange={(e) => setBlackNick(e.target.value)}
              />
            </TabsContent>

            {/* ===== WHITELIST ===== */}
            <TabsContent value="whitelist" className="space-y-2">
              <Textarea
                placeholder="Whitelisted clans"
                value={whiteClan}
                onChange={(e) => setWhiteClan(e.target.value)}
              />
              <Textarea
                placeholder="Whitelisted nicks"
                value={whiteNick}
                onChange={(e) => setWhiteNick(e.target.value)}
              />
            </TabsContent>
          </Tabs>

          {/* ===== STORM CONSOLE ===== */}
          <div className="mt-6">
            <div className="mb-2 flex justify-between items-center">
              <span className="text-sm font-semibold text-purple-400">
                ⚡ STORM CONSOLE
              </span>
              <button
                onClick={() => setLogs([])}
                className="text-xs text-red-400 hover:text-red-300"
              >
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
                  <div
                    key={i}
                    className="mb-1 leading-snug"
                    dangerouslySetInnerHTML={{ __html: log }}
                  />
                ))
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  </div>
)
}
