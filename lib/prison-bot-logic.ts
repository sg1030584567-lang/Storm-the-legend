// Core prison bot logic (FINAL – browser & Vercel safe)

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
  JOIN_WAIT = "JOIN_WAIT",
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
  private cooldownUntil = 0
  private inFlight = false

  // ===== CORE =====
  private settings: BotSettings
  private filters: FilterLists
  private connection: GalaxyConnection

  private targetUsers = new Set<string>()
  private state: BotState = BotState.IDLE
  private joinReadyAt = 0

  // ===== TIMERS (browser-safe) =====
  private attackTimer: number | null = null
  private defenseTimer: number | null = null
  private reconnectTimer: number | null = null

  constructor(
    settings: BotSettings,
    filters: FilterLists,
    connection: GalaxyConnection
  ) {
    this.settings = settings
    this.filters = filters
    this.connection = connection

    // 🔒 LOCKED HOOK
    this.connection.onAfterAction(() => this.onAfterAction())
  }

  // ===================================================
  // AFTER ACTION CLEANUP
  // ===================================================

  private onAfterAction() {
    this.stopTimers()

    this.isAttacking = false
    this.isDefending = false
    this.inFlight = false

    // cooldown 5–8 sec
    this.cooldownUntil = Date.now() + 5000 + Math.random() * 3000

    if (this.settings.disconnectAction) {
      this.nextCycle()
    } else {
      this.state = BotState.ACTIVE
    }
  }

  // ===================================================
  // SETTINGS / FILTERS
  // ===================================================

  updateSettings(settings: BotSettings) {
    this.settings = settings
  }

  updateFilters(filters: FilterLists) {
    this.filters = filters
  }

  // ===================================================
  // TARGET FILTERING
  // ===================================================

  shouldTargetUser(nick: string, clan: string): boolean {
    if (this.settings.prisonAll) return true

    if (
      this.filters.whiteClan.includes(clan) ||
      this.filters.whiteNick.includes(nick)
    ) return false

    if (
      this.filters.blackClan.includes(clan) ||
      this.filters.blackNick.includes(nick)
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

  // ===================================================
  // INTERVAL HELPERS
  // ===================================================

  private calcInterval(
    min: string,
    max: string,
    plusMinus: string,
    usePM: boolean
  ): number {
    const a = Number(min)
    const b = Number(max)
    const pm = Number(plusMinus)

    if (usePM) {
      const base = (a + b) / 2
      return Math.max(0, base + (Math.random() * 2 - 1) * pm)
    }

    return Math.max(0, a + Math.random() * (b - a))
  }

  private getAttackDelay() {
    return this.calcInterval(
      this.settings.attackMin,
      this.settings.attackMax,
      this.settings.attackPlusMinus,
      this.settings.pmTmA
    )
  }

  private getDefenseDelay() {
    return this.calcInterval(
      this.settings.defenseMin,
      this.settings.defenseMax,
      this.settings.defensePlusMinus,
      this.settings.pmTmZ
    )
  }

  // ===================================================
  // GUARDS
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

  startAttack(callback: () => void) {
    if (!this.canAct()) return
    if (this.isAttacking || this.isDefending) return

    this.isAttacking = true
    this.state = BotState.ACTION

    this.attackTimer = window.setTimeout(() => {
      this.inFlight = true
      callback()
      this.isAttacking = false
    }, this.getAttackDelay())
  }

  startDefense(callback: () => void) {
    if (!this.canAct()) return
    if (this.isDefending || this.isAttacking) return

    this.isDefending = true
    this.state = BotState.ACTION

    this.defenseTimer = window.setTimeout(() => {
      this.inFlight = true
      callback()
      this.isDefending = false
    }, this.getDefenseDelay())
  }

  stopTimers() {
    if (this.attackTimer) clearTimeout(this.attackTimer)
    if (this.defenseTimer) clearTimeout(this.defenseTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    this.attackTimer = null
    this.defenseTimer = null
    this.reconnectTimer = null
  }

  // ===================================================
  // DEFENCE TRIGGER
  // ===================================================

  onEnemyActionDetected() {
    if (this.state === BotState.ACTION) return
    this.nextCycle()
  }

  // ===================================================
  // DISCONNECT / RECONNECT LOOP
  // ===================================================

  private nextCycle() {
    if (!this.settings.reconnect) return

    this.stopTimers()
    this.state = BotState.DISCONNECTING

    this.connection.disconnect()
    this.state = BotState.RECONNECTING

    this.reconnectTimer = window.setTimeout(() => {
      // UI layer will re-connect using recovery code
      this.state = BotState.JOIN_WAIT
      this.joinReadyAt = Date.now() + 3000
    }, 150)
  }
}
