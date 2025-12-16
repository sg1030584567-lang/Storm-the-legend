// lib/god-mode-core.ts
// PHASE 1 — GOD CORE (Auto Prison Loop)

import { GodTargetEngine } from "./god-target-engine"
import { GodDefenseEngine } from "./god-defense-engine"
import { GalaxyConnection } from "./galaxy-connection"
import { PrisonBotLogic } from "./prison-bot-logic"

export interface GodCoreOptions {
  minDelay?: number
  maxDelay?: number
  enabled?: boolean
}

export class GodModeCore {
  private targetEngine = new GodTargetEngine()
  private defenseEngine = new GodDefenseEngine()
  private galaxy: GalaxyConnection
  private bot: PrisonBotLogic

  private running = false
  private timer: NodeJS.Timeout | null = null

  private minDelay: number
  private maxDelay: number

  constructor(
    galaxy: GalaxyConnection,
    bot: PrisonBotLogic,
    options: GodCoreOptions = {}
  ) {
    this.galaxy = galaxy
    this.bot = bot

    this.minDelay = options.minDelay ?? 1500
    this.maxDelay = options.maxDelay ?? 2500

    if (options.enabled) {
      this.start()
    }
  }

  /* ================= CORE LOOP ================= */

  private scheduleNext() {
    if (!this.running) return

    const delay =
      this.minDelay +
      Math.random() * (this.maxDelay - this.minDelay)

    this.timer = setTimeout(() => {
      this.executeCycle()
    }, delay)
  }

  private executeCycle() {
    if (!this.running) return
    if (!this.galaxy.isAuthenticated()) {
      this.scheduleNext()
      return
    }

  const botTargets = this.bot.getTargets?.() ?? []

   botTargets.forEach(id => {
   this.targetEngine.addTarget(id, 1)
 })

   const targetId = this.targetEngine.getNextTarget()

   if (!targetId) {
   this.scheduleNext()
   return
 }

   const defenseTargets = this.defenseEngine.getPriorityTargets()

if (defenseTargets.length > 0) {
  const counterTarget = defenseTargets[0]
  this.galaxy.prisonUser(counterTarget)
  this.scheduleNext()
  return
}

    // ⚡ PRISON ACTION
    this.galaxy.prisonUser(targetId)

    this.scheduleNext()
  }

  /* ================= CONTROLS ================= */

  start() {
    if (this.running) return
    this.running = true
    this.scheduleNext()
  }

  stop() {
    this.running = false
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  isRunning() {
    return this.running
  }
}
