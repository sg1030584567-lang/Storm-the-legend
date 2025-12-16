// Prison Bot Logic — GOD MODE (Phase 7.2)
// LOCKED • STABLE • CLEAN

import { GalaxyConnection } from "./galaxy-connection"

/* ================= SETTINGS ================= */

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

/* ================= STATE ================= */

enum BotState {
  IDLE = "IDLE",
  ACTIVE = "ACTIVE",
  ACTION = "ACTION",
  RECONNECTING = "RECONNECTING",
}

/* ================= MAIN CLASS ================= */

export class PrisonBotLogic {
  private connection: GalaxyConnection
  private settings: BotSettings
  private filters: FilterLists
  private currentPlanet: string | null = null
  // 🔒 LOCKED — called from UI
public setPlanet(name: string) {
  this.currentPlanet = name
}

  /* ===== CORE FLAGS ===== */
  private state: BotState = BotState.IDLE
  private inFlight = false
  private cooldownUntil = 0
  private joinReadyAt = 0

  /* ===== TIMERS ===== */
  private attackTimer: number | null = null
  private defenseTimer: number | null = null
  private reconnectTimer: number | null = null

  /* ===== TARGET SYSTEM ===== */
  private targetUsers = new Set<string>()
  private targetQueue: string[] = []
  private currentTargetIndex = 0

  private targetMeta: Record<
    string,
    { priority: number; lastSeen: number }
  > = {}

  /* ===== ENEMY PROFILES (7.2) ===== */
  private enemyProfiles: Record<
    string,
    { hits: number; lastSeen: number; danger: number }
  > = {}

  /* ===== ADAPTIVE MEMORY ===== */
  private lastActionAt = 0
  private aggressionLevel = 1.0

  constructor(
    settings: BotSettings,
    filters: FilterLists,
    connection: GalaxyConnection
  ) {
    this.settings = settings
    this.filters = filters
    this.connection = connection

    // 🔒 LOCKED CALLBACKS
    this.connection.onAfterAction(() => this.onAfterAction())

    this.connection.onPlanetJoined(() => {
      this.joinReadyAt = Date.now() + 3000 // Galaxy rule
      this.state = BotState.ACTIVE
    })

    this.connection.onEnemyPrison?.((enemyId: string) => {
      this.onEnemyPrisoned(enemyId)
    })
  }

  /* ================= SETTINGS ================= */

  updateSettings(settings: BotSettings) {
    this.settings = settings
  }

  updateFilters(filters: FilterLists) {
    this.filters = filters
  }

  /* ================= TARGET FILTER ================= */

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

  /* ================= TARGET QUEUE ================= */

  addTarget(userId: string, priority = 1) {
    this.targetUsers.add(userId)

    const meta = this.targetMeta[userId]
    if (!meta) {
      this.targetMeta[userId] = {
        priority,
        lastSeen: Date.now(),
      }
    } else {
      meta.priority += 1
      meta.lastSeen = Date.now()
    }

    this.rebuildQueue()
  }

  removeTarget(userId: string) {
    this.targetUsers.delete(userId)
    delete this.targetMeta[userId]
    this.rebuildQueue()
  }

  getTargets(): string[] {
    return [...this.targetQueue]
  }

  private rebuildQueue() {
    this.targetQueue = Array.from(this.targetUsers).sort((a, b) => {
      const pa = this.targetMeta[a]?.priority ?? 0
      const pb = this.targetMeta[b]?.priority ?? 0
      if (pb !== pa) return pb - pa
      return (this.targetMeta[a]?.lastSeen ?? 0) -
             (this.targetMeta[b]?.lastSeen ?? 0)
    })

    if (this.currentTargetIndex >= this.targetQueue.length) {
      this.currentTargetIndex = 0
    }
  }

  public getCurrentTarget(): string | null {
    return this.targetQueue[this.currentTargetIndex] ?? null
  }

  private rotateTarget() {
    if (this.targetQueue.length === 0) return
    this.currentTargetIndex =
      (this.currentTargetIndex + 1) % this.targetQueue.length
  }

  /* ================= INTERVAL ================= */

  private calcInterval(
    min: string,
    max: string,
    plusMinus: string,
    usePM: boolean
  ): number {
    const minV = Number(min)
    const maxV = Number(max)
    const pm = Number(plusMinus)

    if (usePM) {
      const base = (minV + maxV) / 2
      return Math.max(400, base + (Math.random() * 2 - 1) * pm)
    }

    return Math.max(400, minV + Math.random() * (maxV - minV))
  }

  private getAttackDelay(): number {
    const base = this.calcInterval(
      this.settings.attackMin,
      this.settings.attackMax,
      this.settings.attackPlusMinus,
      this.settings.pmTmA
    )

    return Math.max(600, base / this.aggressionLevel)
  }

  private getDefenseDelay(): number {
    return this.calcInterval(
      this.settings.defenseMin,
      this.settings.defenseMax,
      this.settings.defensePlusMinus,
      this.settings.pmTmZ
    )
  }

  /* ================= GUARDS ================= */

  private canAct(): boolean {
    const now = Date.now()

    if (this.state !== BotState.ACTIVE) return false
    if (this.inFlight) return false
    if (now < this.joinReadyAt) return false
    if (now < this.cooldownUntil) return false
    if (!this.connection.isAuthenticated()) return false

    return true
  }

  /* ================= MAIN LOOP ================= */

  public start() {
    if (this.state === BotState.ACTIVE) return
    this.state = BotState.ACTIVE
    this.joinReadyAt = Date.now() + 3000
    this.loop()
  }

  private loop() {
    if (!this.canAct()) {
      setTimeout(() => this.loop(), 250)
      return
    }

    const targetId = this.getCurrentTarget()
    if (!targetId) {
      setTimeout(() => this.loop(), 500)
      return
    }

    this.startAttack(targetId)
    setTimeout(() => this.loop(), 300)
  }

  /* ================= ACTIONS ================= */

  private startAttack(targetId: string) {
    if (!this.canAct()) return

    this.inFlight = true
    this.state = BotState.ACTION

    if (this.attackTimer) clearTimeout(this.attackTimer)

    this.attackTimer = window.setTimeout(() => {
      this.lastActionAt = Date.now()
      this.connection.prisonUser(targetId)
    }, this.getAttackDelay())
  }

  private startDefense(cb: () => void) {
    if (!this.canAct()) return

    this.inFlight = true
    this.state = BotState.ACTION

    if (this.defenseTimer) clearTimeout(this.defenseTimer)

    this.defenseTimer = window.setTimeout(cb, this.getDefenseDelay())
  }

  private stopTimers() {
    if (this.attackTimer) clearTimeout(this.attackTimer)
    if (this.defenseTimer) clearTimeout(this.defenseTimer)
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)

    this.attackTimer = null
    this.defenseTimer = null
    this.reconnectTimer = null
  }

  /* ================= ENEMY HANDLING (7.2) ================= */

  private onEnemyPrisoned(enemyId: string) {
    const p =
      this.enemyProfiles[enemyId] ??
      (this.enemyProfiles[enemyId] = {
        hits: 0,
        lastSeen: Date.now(),
        danger: 0,
      })

    p.hits++
    p.lastSeen = Date.now()
    p.danger = Math.min(100, p.danger + 15)

    this.addTarget(enemyId, p.danger >= 60 ? 3 : 2)

    if (this.settings.standOnEnemy && this.canAct()) {
      this.startDefense(() => {
        this.connection.prisonUser(enemyId)
      })
    }
  }

  /* ================= AFTER ACTION ================= */

  private onAfterAction() {
    this.stopTimers()

    this.inFlight = false
    const now = Date.now()

    const gap = now - this.lastActionAt
    this.lastActionAt = now

    if (gap < 2500) {
      this.aggressionLevel = Math.max(0.7, this.aggressionLevel - 0.1)
    } else if (gap > 6000) {
      this.aggressionLevel = Math.min(1.4, this.aggressionLevel + 0.1)
    }

    this.cooldownUntil = now + 5000 + Math.random() * 3000
    this.rotateTarget()

    this.state = BotState.ACTIVE
  }
}
