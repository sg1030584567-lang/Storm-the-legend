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

const botRef = useRef<PrisonBotLogic | null>(null) // ✅ ADD THIS

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

  /* ================= CONNECTION ================= */

  const connect = async () => {
  if (isConnected) return

  try {
    const conn = new GalaxyConnection()

    conn.onLog((msg: string) => addLog(msg))

    await conn.connect(recoveryCode)

    setIsConnected(true)

    botRef.current = new PrisonBotLogic(conn, settings, {
      onLog: (msg: string) => addLog(msg),
    })

    toast({ title: "Connected to Galaxy" })
  } catch (e: any) {
    toast({
      title: "Connection failed",
      description: e?.message || "Unknown error",
      variant: "destructive",
    })
  }
}

  const disconnect = () => {
    botLogicRef.current?.stop()
    galaxyRef.current?.disconnect()

    botLogicRef.current = null
    galaxyRef.current = null

    setIsConnected(false)
    setBotRunning(false)
    botRunningRef.current = false

    toast({ title: "Disconnected" })
  }

  /* ================= BOT ================= */

  const startBot = () => {
    if (!galaxyRef.current || !botLogicRef.current) return

    setBotRunning(true)
    botRunningRef.current = true

    botLogicRef.current.start()
    addLog("⚡ Bot started")
    toast({ title: "Bot started" })
  }

  /* ================= EFFECTS ================= */

  useEffect(() => {
    filtersRef.current = {
      blackClan: blackClan.split("\n").filter(Boolean),
      blackNick: blackNick.split("\n").filter(Boolean),
      whiteClan: whiteClan.split("\n").filter(Boolean),
      whiteNick: whiteNick.split("\n").filter(Boolean),
    }

    botLogicRef.current?.updateFilters(filtersRef.current)
  }, [blackClan, blackNick, whiteClan, whiteNick])

  useEffect(() => {
    botLogicRef.current?.updateSettings(settings)
  }, [settings])

  /* ================= TEMP PLANET ================= */

  const travelToPlanet = () => {
    addLog(`🌍 Traveling to planet: ${planetName}`)
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-4">
      <Toaster />

      <h1 className="text-3xl font-extrabold text-center text-purple-400 mb-1 tracking-wide">
        Storm-The Legend Killer
      </h1>
      <p className="text-center text-gray-400 mb-6 text-sm">
        project by AWARA_HUN
      </p>

      <div className="mx-auto max-w-2xl">
        <Card className="bg-black/70 border border-purple-500/30 backdrop-blur shadow-[0_0_40px_rgba(168,85,247,0.25)]">
          <CardContent className="space-y-6 pt-6">

            {/* STATUS */}
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

            <Tabs defaultValue="main">
              <TabsList className="grid grid-cols-4 bg-zinc-900">
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
                <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
              </TabsList>

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
                  <Button className="mt-2" onClick={travelToPlanet}>
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

              <TabsContent value="blacklist">
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

              <TabsContent value="whitelist">
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

            {/* LOGS */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-purple-400 font-semibold">
                  ⚡ STORM CONSOLE
                </span>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-red-400"
                >
                  Clear
                </button>
              </div>

              <div className="h-52 overflow-y-auto rounded-xl bg-black border border-purple-500/30 p-3 text-xs font-mono text-green-400">
                {logs.length === 0 ? (
                  <div className="text-gray-500 italic">
                    Waiting for storm activity...
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div
                      key={i}
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
