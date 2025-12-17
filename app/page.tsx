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
import { GodCore } from "@/lib/god-core"
import StormAvatar from "@/components/StormAvatar"

export default function GalaxyPrisonBot() {
  const { toast } = useToast()

  /* ================= STATE ================= */

  const [isConnected, setIsConnected] = useState(false)
  const [botRunning, setBotRunning] = useState(false)

  const [recoveryCode, setRecoveryCode] = useState("")
  const [planetName, setPlanetName] = useState("main")

  const [logs, setLogs] = useState<string[]>([])
  const [liveUsers, setLiveUsers] = useState<
    { id: string; nick: string; clan: string }[]
  >([])

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
  const godRef = useRef<GodCore | null>(null)

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

    galaxy.onLog(addLog)

    galaxy.onConnected(() => {
      setIsConnected(true)
      addLog("Connected to Galaxy")
      toast({ title: "Connected" })
    })

    galaxy.onDisconnected(() => {
      setIsConnected(false)
      setBotRunning(false)
      setLiveUsers([])
      botRef.current = null
      godRef.current = null
      addLog("Disconnected")
    })

    galaxy.onUserJoin((user) => {
      setLiveUsers((p) => [...p, user])

      const bot = botRef.current
      if (!bot || !botRunning) return

      if (bot.shouldTargetUser(user.nick, user.clan)) {
        bot.addTarget(user.id)
        addLog(`🎯 Target acquired: ${user.nick}`)
      }
    })

    galaxy.onUserPart((userId) => {
      setLiveUsers((p) => p.filter((u) => u.id !== userId))
      botRef.current?.removeTarget(userId)
    })

    galaxy.onPlanetJoined(() => {
      addLog(`🌍 Joined planet: ${planetName}`)
      botRef.current?.setPlanet(planetName)
    })

    galaxy.connect(recoveryCode)

    const bot = new PrisonBotLogic(settings, filtersRef.current, galaxy)
    botRef.current = bot
    godRef.current = new GodCore(bot)
  }

  const disconnect = () => {
    galaxyRef.current?.disconnect()
    galaxyRef.current = null
    botRef.current = null
    godRef.current = null
    setIsConnected(false)
    setBotRunning(false)
    setLiveUsers([])
    addLog("Manual disconnect")
  }

  /* ================= BOT ================= */

  const startBot = () => {
    if (!isConnected || !botRef.current) return
    setBotRunning(true)
    botRef.current.start()
    addLog("⚡ God mode engaged")
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

  const travelToPlanet = () => {
    galaxyRef.current?.joinPlanet(planetName)
  }

  /* ================= UI ================= */

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <Toaster />
      {/* UI unchanged – already correct */}
      {/* (same JSX you pasted, no logic changes) */}
    </div>
  )
}
