"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { GalaxyConnection } from "@/lib/galaxy-connection"
import { PrisonBotLogic, type BotSettings } from "@/lib/prison-bot-logic"

export default function GalaxyPrisonBot() {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState("")
  const [planetName, setPlanetName] = useState("main")
  const [logs, setLogs] = useState<string[]>([])
  const [botRunning, setBotRunning] = useState(false)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const galaxyRef = useRef<GalaxyConnection | null>(null)
  const botLogicRef = useRef<PrisonBotLogic | null>(null)

  const botRunningRef = useRef(false)
  const settingsRef = useRef<BotSettings>({
    prisonAll: true,
    userPart: true,
    timeout3Sec: true,
    disconnectAction: false,
    reconnect: false,
    standOnEnemy: false,
    prisonAndOff: false,
    reFlyJoin: false,
    timerReconnect: "10200",
    attackMin: "1700",
    attackMax: "2000",
    attackPlusMinus: "5",
    defenseMin: "1600",
    defenseMax: "1600",
    defensePlusMinus: "5",
    pmTmA: false,
    pmTmZ: false,
  })
  const filtersRef = useRef({
    blackClan: [] as string[],
    blackNick: [] as string[],
    whiteClan: [] as string[],
    whiteNick: [] as string[],
  })

  const [settings, setSettings] = useState<BotSettings>({
    prisonAll: true,
    userPart: true,
    timeout3Sec: true,
    disconnectAction: false,
    reconnect: false,
    standOnEnemy: false,
    prisonAndOff: false,
    reFlyJoin: false,
    timerReconnect: "10200",
    attackMin: "1700",
    attackMax: "2000",
    attackPlusMinus: "5",
    defenseMin: "1600",
    defenseMax: "1600",
    defensePlusMinus: "5",
    pmTmA: false,
    pmTmZ: false,
  })

  // Lists
  const [blackClan, setBlackClan] = useState("")
  const [blackNick, setBlackNick] = useState("")
  const [whiteClan, setWhiteClan] = useState("")
  const [whiteNick, setWhiteNick] = useState("")

  useEffect(() => {
    settingsRef.current = settings
    if (botLogicRef.current) {
      botLogicRef.current.updateSettings(settings)
    }
  }, [settings])

  useEffect(() => {
    botRunningRef.current = botRunning
  }, [botRunning])

  useEffect(() => {
    filtersRef.current = {
      blackClan: blackClan.split("\n").filter((x) => x.trim()),
      blackNick: blackNick.split("\n").filter((x) => x.trim()),
      whiteClan: whiteClan.split("\n").filter((x) => x.trim()),
      whiteNick: whiteNick.split("\n").filter((x) => x.trim()),
    }
    if (botLogicRef.current) {
      botLogicRef.current.updateFilters(filtersRef.current)
    }
  }, [blackClan, blackNick, whiteClan, whiteNick])

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`])
  }, [])

  const disconnectBot = useCallback(() => {
    if (galaxyRef.current) {
      galaxyRef.current.disconnect()
    }
    setIsConnected(false)
    setBotRunning(false)
    botRunningRef.current = false
  }, [])

  const startBot = useCallback(() => {
    setBotRunning(true)
    botRunningRef.current = true
    addLog("<span style='color: lime'>Bot started - waiting for targets...</span>")
  }, [addLog])

  const travelToPlanet = useCallback(() => {
    if (galaxyRef.current && galaxyRef.current.isAuthenticated()) {
      galaxyRef.current.joinPlanet(planetName)
    }
  }, [planetName])

  const handleUserJoin = useCallback(
    (user: { id: string; nick: string; clan: string }) => {
      const isBotActive = botRunningRef.current
      const currentSettings = settingsRef.current

      console.log("[v0] handleUserJoin:", user.nick, "botActive:", isBotActive, "prisonAll:", currentSettings.prisonAll)

      if (!isBotActive) {
        console.log("[v0] Bot not running, skipping prison action")
        return
      }

      const currentFilters = filtersRef.current

      // Check if we should target this user
      let shouldTarget = false

      if (currentSettings.prisonAll) {
        // Prison all mode - target everyone
        shouldTarget = true
      } else {
        // Check whitelist first (whitelist = skip)
        const isWhitelisted =
          currentFilters.whiteClan.some((c) => c.toLowerCase() === user.clan.toLowerCase()) ||
          currentFilters.whiteNick.some((n) => n.toLowerCase() === user.nick.toLowerCase())

        if (isWhitelisted) {
          shouldTarget = false
        } else {
          // Check blacklist (blacklist = target)
          const isBlacklisted =
            currentFilters.blackClan.some((c) => c.toLowerCase() === user.clan.toLowerCase()) ||
            currentFilters.blackNick.some((n) => n.toLowerCase() === user.nick.toLowerCase())

          if (isBlacklisted) {
            shouldTarget = true
          }
        }
      }

      if (shouldTarget) {
        addLog(`<span style='color: yellow'>Targeting: ${user.nick} [${user.id}]</span>`)

        // Calculate attack interval
        const attackMin = Number.parseInt(currentSettings.attackMin) || 1700
        const attackMax = Number.parseInt(currentSettings.attackMax) || 2000
        const attackInterval = Math.floor(Math.random() * (attackMax - attackMin + 1)) + attackMin

        addLog(`<span style='color: cyan'>Attack in ${attackInterval}ms</span>`)

        // Execute prison action after interval
        setTimeout(() => {
          if (galaxyRef.current && botRunningRef.current) {
            addLog(`<span style='color: red'>PRISON ACTION: ${user.nick}</span>`)
            galaxyRef.current.prisonUser(user.id)

            if (settingsRef.current.prisonAndOff) {
              addLog("<span style='color: orange'>Auto-disconnect after prison</span>")
              setTimeout(() => disconnectBot(), 500)
            }

            if (settingsRef.current.reFlyJoin) {
              addLog("<span style='color: cyan'>Re-flying to planet...</span>")
              setTimeout(() => travelToPlanet(), 2000)
            }
          }
        }, attackInterval)
      }
    },
    [addLog, disconnectBot, travelToPlanet],
  )

  const handleUserPart = useCallback(
    (userId: string) => {
      if (botLogicRef.current) {
        botLogicRef.current.removeTarget(userId)
      }

      if (settingsRef.current.userPart && botRunningRef.current) {
        addLog("<span style='color: red'>Target left, disconnecting...</span>")
        disconnectBot()
      }
    },
    [addLog, disconnectBot],
  )

  useEffect(() => {
    const galaxy = new GalaxyConnection()
    galaxyRef.current = galaxy

    const botLogic = new PrisonBotLogic()
    botLogic.updateSettings(settingsRef.current)
    botLogicRef.current = botLogic

    galaxy.onLog((message) => {
      addLog(message)
    })

    galaxy.onConnected(() => {
      setIsConnected(true)
      toast({
        title: "Connected",
        description: "Connected to Galaxy server",
      })
    })

    galaxy.onDisconnected(() => {
      setIsConnected(false)
      setBotRunning(false)
      botRunningRef.current = false
      toast({
        title: "Disconnected",
        description: "Disconnected from Galaxy server",
        variant: "destructive",
      })
    })

    galaxy.onUserJoin(handleUserJoin)
    galaxy.onUserPart(handleUserPart)

    galaxy.onPlanetJoined(() => {
      addLog("<span style='color: lime'>Planet joined - Bot auto-started!</span>")
      setBotRunning(true)
      botRunningRef.current = true
    })

    return () => {
      galaxy.disconnect()
    }
  }, [addLog, handleUserJoin, handleUserPart, toast])

  // Scroll to bottom when logs update
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  const connectBot = () => {
    if (!recoveryCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a recovery code",
        variant: "destructive",
      })
      return
    }

    if (galaxyRef.current) {
      galaxyRef.current.connect(recoveryCode)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <Toaster />
      <div className="mx-auto max-w-2xl">
        <Card className="border-purple-500/30 bg-gray-900/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent">
              Galaxy Prison Bot
            </CardTitle>
            <CardDescription className="text-gray-400">Automated prison system for Galaxy game</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="main" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
                <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
              </TabsList>

              <TabsContent value="main" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery" className="text-gray-300">
                      Recovery Code:
                    </Label>
                    <Input
                      id="recovery"
                      type="text"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      placeholder="Enter recovery code"
                      className="border-gray-600 bg-gray-800 text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={connectBot}
                      disabled={isConnected}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      Connect
                    </Button>
                    <Button onClick={disconnectBot} disabled={!isConnected} variant="destructive" className="flex-1">
                      Disconnect
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="planet" className="text-gray-300">
                      Planet:
                    </Label>
                    <Input
                      id="planet"
                      type="text"
                      value={planetName}
                      onChange={(e) => setPlanetName(e.target.value)}
                      placeholder="Planet name"
                      className="border-gray-600 bg-gray-800 text-white"
                    />
                  </div>

                  <Button
                    onClick={travelToPlanet}
                    disabled={!isConnected}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Travel
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      onClick={startBot}
                      disabled={!isConnected || botRunning}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Start Bot
                    </Button>
                    <Button
                      onClick={() => {
                        setBotRunning(false)
                        botRunningRef.current = false
                        addLog("<span style='color: orange'>Bot stopped</span>")
                      }}
                      disabled={!botRunning}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      Stop Bot
                    </Button>
                  </div>

                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-gray-300">{isConnected ? "Connected" : "Disconnected"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${botRunning ? "bg-green-500" : "bg-yellow-500"}`} />
                      <span className="text-gray-300">Bot {botRunning ? "Active" : "Inactive"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Activity Log</Label>
                    <div
                      ref={logContainerRef}
                      className="h-48 overflow-y-auto rounded border border-gray-600 bg-gray-800 p-2 text-sm"
                    >
                      {logs.map((log, i) => (
                        <div key={i} className="text-gray-300" dangerouslySetInnerHTML={{ __html: log }} />
                      ))}
                    </div>
                    <Button
                      onClick={clearLogs}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-300 bg-transparent"
                    >
                      Clear Logs
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Prison all players</Label>
                    <Switch
                      checked={settings.prisonAll}
                      onCheckedChange={(checked) => setSettings({ ...settings, prisonAll: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Disconnect when enemy leaves planet</Label>
                    <Switch
                      checked={settings.userPart}
                      onCheckedChange={(checked) => setSettings({ ...settings, userPart: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Disconnect if caught after 3 seconds</Label>
                    <Switch
                      checked={settings.timeout3Sec}
                      onCheckedChange={(checked) => setSettings({ ...settings, timeout3Sec: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Disconnect immediately after action</Label>
                    <Switch
                      checked={settings.disconnectAction}
                      onCheckedChange={(checked) => setSettings({ ...settings, disconnectAction: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Auto reconnect</Label>
                    <Switch
                      checked={settings.reconnect}
                      onCheckedChange={(checked) => setSettings({ ...settings, reconnect: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Stand on enemy</Label>
                    <Switch
                      checked={settings.standOnEnemy}
                      onCheckedChange={(checked) => setSettings({ ...settings, standOnEnemy: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Disconnect after prison</Label>
                    <Switch
                      checked={settings.prisonAndOff}
                      onCheckedChange={(checked) => setSettings({ ...settings, prisonAndOff: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Re-fly after prison</Label>
                    <Switch
                      checked={settings.reFlyJoin}
                      onCheckedChange={(checked) => setSettings({ ...settings, reFlyJoin: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Reconnect Interval (ms)</Label>
                    <Input
                      type="text"
                      value={settings.timerReconnect}
                      onChange={(e) => setSettings({ ...settings, timerReconnect: e.target.value })}
                      className="border-gray-600 bg-gray-800 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Attack Interval (min/max/+-)</Label>
                      <Switch
                        checked={settings.pmTmA}
                        onCheckedChange={(checked) => setSettings({ ...settings, pmTmA: checked })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="text"
                        value={settings.attackMin}
                        onChange={(e) => setSettings({ ...settings, attackMin: e.target.value })}
                        className="border-gray-600 bg-gray-800 text-white"
                        placeholder="Min"
                      />
                      <Input
                        type="text"
                        value={settings.attackMax}
                        onChange={(e) => setSettings({ ...settings, attackMax: e.target.value })}
                        className="border-gray-600 bg-gray-800 text-white"
                        placeholder="Max"
                      />
                      <Input
                        type="text"
                        value={settings.attackPlusMinus}
                        onChange={(e) => setSettings({ ...settings, attackPlusMinus: e.target.value })}
                        className="border-gray-600 bg-gray-800 text-white"
                        placeholder="+-"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-300">Defense Interval (min/max/+-)</Label>
                      <Switch
                        checked={settings.pmTmZ}
                        onCheckedChange={(checked) => setSettings({ ...settings, pmTmZ: checked })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="text"
                        value={settings.defenseMin}
                        onChange={(e) => setSettings({ ...settings, defenseMin: e.target.value })}
                        className="border-gray-600 bg-gray-800 text-white"
                        placeholder="Min"
                      />
                      <Input
                        type="text"
                        value={settings.defenseMax}
                        onChange={(e) => setSettings({ ...settings, defenseMax: e.target.value })}
                        className="border-gray-600 bg-gray-800 text-white"
                        placeholder="Max"
                      />
                      <Input
                        type="text"
                        value={settings.defensePlusMinus}
                        onChange={(e) => setSettings({ ...settings, defensePlusMinus: e.target.value })}
                        className="border-gray-600 bg-gray-800 text-white"
                        placeholder="+-"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="blacklist" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Blacklist Clans:</Label>
                    <Textarea
                      value={blackClan}
                      onChange={(e) => setBlackClan(e.target.value)}
                      placeholder="One clan per line"
                      className="h-32 border-gray-600 bg-gray-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Blacklist Nicknames:</Label>
                    <Textarea
                      value={blackNick}
                      onChange={(e) => setBlackNick(e.target.value)}
                      placeholder="One nickname per line"
                      className="h-32 border-gray-600 bg-gray-800 text-white"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="whitelist" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Whitelist Clans:</Label>
                    <Textarea
                      value={whiteClan}
                      onChange={(e) => setWhiteClan(e.target.value)}
                      placeholder="One clan per line"
                      className="h-32 border-gray-600 bg-gray-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Whitelist Nicknames:</Label>
                    <Textarea
                      value={whiteNick}
                      onChange={(e) => setWhiteNick(e.target.value)}
                      placeholder="One nickname per line"
                      className="h-32 border-gray-600 bg-gray-800 text-white"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
