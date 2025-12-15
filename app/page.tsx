"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  const botRef = useRef<PrisonBotLogic | null>(null)

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

  const connect = () => {
    if (isConnected) return
    if (!recoveryCode.trim()) {
      toast({ title: "Recovery code required", variant: "destructive" })
      return
    }

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
      botRef.current = null
      toast({ title: "Disconnected", variant: "destructive" })
    })

    galaxy.onUserJoin((user) => {
      const bot = botRef.current
      if (!bot || !botRunning) return

      if (bot.shouldTargetUser(user.nick, user.clan)) {
        bot.addTarget(user.id)
        addLog(`🎯 Target acquired: ${user.nick}`)
      }
    })

    galaxy.onUserPart((userId) => {
      botRef.current?.removeTarget(userId)
    })

    galaxy.onPlanetJoined(() => {
      addLog(`🌍 Joined planet: ${planetName}`)
    })

    galaxy.connect(recoveryCode)

    botRef.current = new PrisonBotLogic(
      settings,
      filtersRef.current,
      galaxy
    )
  }

  const disconnect = () => {
    galaxyRef.current?.disconnect()
    galaxyRef.current = null
    botRef.current = null
    setIsConnected(false)
    setBotRunning(false)
  }

  /* ================= BOT ================= */

  const startBot = () => {
    if (!isConnected || !botRef.current) return
    setBotRunning(true)
    addLog("⚡ Bot armed")
  }

  /* ================= EFFECTS ================= */

  useEffect(() => {
    filtersRef.current = {
      blackClan: blackClan.split("\n").filter(Boolean),
      blackNick: blackNick.split("\n").filter(Boolean),
      whiteClan: whiteClan.split("\n").filter(Boolean),
      whiteNick: whiteNick.split("\n").filter(Boolean),
    }

    botRef.current?.updateFilters(filtersRef.current)
  }, [blackClan, blackNick, whiteClan, whiteNick])

  useEffect(() => {
    botRef.current?.updateSettings(settings)
  }, [settings])

  /* ================= ACTIONS ================= */

  const travelToPlanet = () => {
    if (!galaxyRef.current) return
    galaxyRef.current.joinPlanet(planetName)
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white p-4">
      <Toaster />

      <h1 className="text-3xl font-extrabold text-center text-purple-400 mb-1">
        Storm-The Legend Killer
      </h1>
      <p className="text-center text-gray-400 mb-6 text-sm">
        project by AWARA_HUN
      </p>

      <div className="mx-auto max-w-2xl">
        <Card className="bg-black/70 border border-purple-500/30">
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

              {/* MAIN */}
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
                  <Button variant="destructive" onClick={disconnect}>
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

              {/* BLACKLIST */}
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

              {/* WHITELIST */}
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
                    <div key={i}>{log}</div>
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
