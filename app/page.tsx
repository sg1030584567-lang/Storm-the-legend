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
    <div className="min-h-screen bg-black text-white p-4">
      <h1 className="text-3xl font-bold text-center text-purple-400 mb-1">
        Storm-The Legend Killer
      </h1>
      <p className="text-center text-gray-400 mb-6">
        project by AWARA_HUN
      </p>

      {/* ===== STORM LOG CONSOLE ===== */}
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
  )
}

  )
}



