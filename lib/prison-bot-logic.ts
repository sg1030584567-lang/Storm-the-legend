// Core prison bot logic

import { GalaxyConnection } from "./GalaxyConnection" // path agar alag ho to adjust kar lena

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

export class PrisonBotLogic {

  // ===== FLAGS =====
  private isAttacking = false
  private isDefending = false
  private isCaught = false
  private cooldownUntil = 0

  // ===== CORE DATA =====
  private settings: BotSettings
  private filters: FilterLists
  private connection: GalaxyConnection

  private currentPlanetId: string | null = null
  private targetUsers: Set<string> = new Set()

  // ===== TIMERS =====
  private attackTimer: NodeJS.Timeout | null = null
  private defenseTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private caughtTimer: NodeJS.Timeout | null = null

  constructor(
    settings: BotSettings,
    filters: FilterLists,
    connection: GalaxyConnection
  ) {
    this.settings = settings
    this.filters = filters
    this.connection = connection

    // 🔔 Action complete listener (PRISON / FLY)
   if (this.connection) {
  this.connection.onAfterAction(() => {
    this.onAfterAction()
  })
} else {
  console.warn("PrisonBotLogic: GalaxyConnection undefined")
}
  }

  // ===================================================
  // AFTER ACTION CLEANUP
  // ===================================================

  private onAfterAction() {
    this.stopTimers()

    this.isAttacking = false
    this.isDefending = false
    this.isCaught = false

    // ⏳ Cooldown 5–8 sec
    this.cooldownUntil = Date.now() + (5000 + Math.random() * 3000)

    if (this.settings.disconnectAction) {
      this.disconnect("after_action")
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
    ) {
      return false
    }

    if (
      this.filters.blackClan.includes(clan) ||
      this.filters.blackNick.includes(username)
    ) {
      return true
    }

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
      return base + (Math.random() * 2 - 1) * pmVal
    }

    return minVal + Math.random() * (maxVal - minVal)
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
  // TIMERS
  // ===================================================

  startAttackTimer(callback: () => void) {
    if (Date.now() < this.cooldownUntil) return
    if (this.isAttacking || this.isDefending) return

    this.isAttacking = true

    if (this.attackTimer) clearTimeout(this.attackTimer)

    const interval = this.getAttackInterval()

    this.attackTimer = setTimeout(() => {
      callback()
      this.isAttacking = false
      this.startAttackTimer(callback)
    }, interval)
  }

  startDefenseTimer(callback: () => void) {
    if (Date.now() < this.cooldownUntil) return
    if (this.isDefending || this.isAttacking) return

    this.isDefending = true

    if (this.defenseTimer) clearTimeout(this.defenseTimer)

    const interval = this.getDefenseInterval()

    this.defenseTimer = setTimeout(() => {
      callback()
      this.isDefending = false
      this.startDefenseTimer(callback)
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
      // 🔥 YAHAN REAL PRISON / ATTACK CALL AAYEGA
      // example:
      // this.connection.prisonUser(targetId)
    })
  }

  private restartDefense() {
    this.stopTimers()

    this.startDefenseTimer(() => {
      // 🔥 YAHAN REAL DEFENSE LOGIC AAYEGA
    })
  }

  // ===================================================
  // DISCONNECT / RECONNECT
  // ===================================================

  private disconnect(reason: string = "") {
    this.stopTimers()

    if (!this.settings.reconnect) return

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    const wait = Number(this.settings.timerReconnect || 0)
    if (wait > 0) {
      this.reconnectTimer = setTimeout(() => {
        this.connection.connect?.()
      }, wait)
    }
  }
}
