// Core prison bot logic (merged & hardened)

import { GalaxyConnection } from "./galaxy-connection"

// ================== SETTINGS & FILTERS ==================

export interface BotSettings {
  prisonAll: boolean
  userPart: boolean
  timeout3Sec: boolean
  disconnectAction: boolean
  reconnect: boolean
  standOnEnemy: boolean
  prisonAndOff: boolean
  reFlyJoin: boolean
  timerReconnect: string
  attackMin: string
  attackMax: string
  attackPlusMinus: string
  defenseMin: string
  defenseMax: string
  defensePlusMinus: string
  pmTmA: boolean
  pmTmZ: boolean
}

export interface FilterLists {
  blackClan: string[]
  blackNick: string[]
  whiteClan: string[]
  whiteNick: string[]
}

// ================== STATE MACHINE ==================

enum BotState {
  IDLE = "IDLE",
  JOIN_WAIT = "JOIN_WAIT",     // Galaxy 3-sec rule
  ACTIVE = "ACTIVE",
  ACTION = "ACTION",
  DISCONNECTING = "DISCONNECTING",
  RECONNECTING = "RECONNECTING",
}

// ================== MAIN LOGIC ==================

export class PrisonBotLogic {

  // ===== FLAGS =====
  private isAttacking = false
  private isDefending = false
  private isCaught = false
  private cooldownUntil = 0

  // ===== CORE DATA =====
  private settings: BotSettings
  private filters: FilterLists
  private connection!: GalaxyConnection

  private currentPlanetId: string | null = null
  private targetUsers: Set<string> = new Set()

  // ===== STATE =====
  private state: BotState = BotState.IDLE
  private joinReadyAt = 0
  private inFlight = false
  private cycleId = 0

  // ===== TIMERS =====
  private attackTimer: NodeJS.Timeout | null = null
  private defenseTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private caughtTimer: NodeJS.Timeout | null = null

  constructor(
  settings: BotSettings,
  filters: FilterLists,
  connection?: GalaxyConnection
) {
  this.settings = settings
  this.filters = filters

  if (!connection) {
    console.warn("PrisonBotLogic: GalaxyConnection missing – bot idle")
    return
  }

  this.connection = connection

  this.connection.onAfterAction?.(() => {
    this.onAfterAction()
  })
}

  // ===================================================
  // AFTER ACTION CLEANUP
  // ===================================================

  private onAfterAction() {
    this.stopTimers()

    this.isAttacking = false
    this.isDefending = false
    this.isCaught = false

    // Cooldown 5–8 sec
    this.cooldownUntil = Date.now() + (5000 + Math.random() * 3000)

    // Immediate cycle (competitive)
    if (this.settings.disconnectAction) {
      this.nextCycle("after_action")
    }
  }

  // ===================================================
  // SETTINGS / FILTERS
  // ===================================================

  updateSettings(settings: BotSettings) {
    this.settings = settings
    this.restartAttack()
    this.restartDefense()
  }

  updateFilters(filters: FilterLists) {
    this.filters = filters
  }

  // ===================================================
  // TARGET LOGIC
  // ===================================================

  shouldTargetUser(username: string, clan: string): boolean {
    if (this.settings.prisonAll) return true

    if (
      this.filters.whiteClan.includes(clan) ||
      this.filters.whiteNick.includes(username)
    ) return false

    if (
      this.filters.blackClan.includes(clan) ||
      this.filters.blackNick.includes(username)
    ) return true

    return false
  }

  addTarget(userId: string) {
    this.targetUsers.add(userId)
  }

  removeTarget(userId: string) {
    this.targetUsers.delete(userId)
  }

  clearTargets() {
    this.targetUsers.clear()
  }

  getTargets(): string[] {
    return Array.from(this.targetUsers)
  }

  // ===================================================
  // INTERVAL HELPERS
  // ===================================================

  private calculateInterval(
    min: string,
    max: string,
    plusMinus: string,
    usePM: boolean
  ): number {
    const minVal = Number(min)
    const maxVal = Number(max)
    const pmVal = Number(plusMinus)

    if (usePM) {
      const base = (minVal + maxVal) / 2
      return Math.max(0, base + (Math.random() * 2 - 1) * pmVal)
    }

    return Math.max(0, minVal + Math.random() * (maxVal - minVal))
  }

  private getAttackInterval(): number {
    return this.calculateInterval(
      this.settings.attackMin,
      this.settings.attackMax,
      this.settings.attackPlusMinus,
      this.settings.pmTmA
    )
  }

  private getDefenseInterval(): number {
    return this.calculateInterval(
      this.settings.defenseMin,
      this.settings.defenseMax,
      this.settings.defensePlusMinus,
      this.settings.pmTmZ
    )
  }

  // ===================================================
  // STATE GUARDS
  // ===================================================

  private canAct(): boolean {
    if (this.inFlight) return false
    if (this.state !== BotState.ACTIVE) return false
    if (Date.now() < this.joinReadyAt) return false
    if (Date.now() < this.cooldownUntil) return false
    return true
  }

  // ===================================================
  // TIMERS
  // ===================================================

  startAttackTimer(callback: () => void) {
    if (!this.canAct()) return
    if (this.isAttacking || this.isDefending) return

    this.isAttacking = true
    this.state = BotState.ACTION

    if (this.attackTimer) clearTimeout(this.attackTimer)

    const interval = this.getAttackInterval()

    this.attackTimer = setTimeout(() => {
      this.inFlight = true
      callback()
      this.isAttacking = false
    }, interval)
  }

  startDefenseTimer(callback: () => void) {
    if (!this.canAct()) return
    if (this.isDefending || this.isAttacking) return

    this.isDefending = true
    this.state = BotState.ACTION

    if (this.defenseTimer) clearTimeout(this.defenseTimer)

    const interval = this.getDefenseInterval()

    this.defenseTimer = setTimeout(() => {
      this.inFlight = true
      callback()
      this.isDefending = false
    }, interval)
  }

  stopTimers() {
    if (this.attackTimer) {
      clearTimeout(this.attackTimer)
      this.attackTimer = null
    }
    if (this.defenseTimer) {
      clearTimeout(this.defenseTimer)
      this.defenseTimer = null
    }
    if (this.caughtTimer) {
      clearTimeout(this.caughtTimer)
      this.caughtTimer = null
    }
  }

  // ===================================================
  // RESTART LOGIC
  // ===================================================

  private restartAttack() {
    if (!this.settings.prisonAll) return
    this.stopTimers()

    this.startAttackTimer(() => {
      // TODO: real prison/attack call
      // this.connection.prisonUser(targetId)
    })
  }

  private restartDefense() {
    this.stopTimers()

    this.startDefenseTimer(() => {
      // TODO: real defence logic
    })
  }

  // ===================================================
  // DEFENCE TRIGGER (CALL WHEN BOT IS TARGETED)
  // ===================================================

  public onEnemyActionDetected() {
    if (this.state === BotState.ACTION) return
    this.nextCycle("defence")
  }

  // ===================================================
  // DISCONNECT / RECONNECT (FAST LOOP)
  // ===================================================

  private nextCycle(reason: string) {
    if (!this.settings.reconnect) return

    this.cycleId++
    this.inFlight = false
    this.stopTimers()

    this.state = BotState.DISCONNECTING   
    this.connection.disconnect?.()
    this.state = BotState.RECONNECTING

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    // ⚡ competitive fast reconnect
    this.reconnectTimer = setTimeout(() => {
if (this.currentPlanetId) {
  this.connection.connect?.(this.currentPlanetId)
}    }, 120)
  }
}
