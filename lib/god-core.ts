import { PrisonBotLogic } from "./prison-bot-logic"

export type GodMode =
  | "PASSIVE"
  | "BALANCED"
  | "AGGRESSIVE"
  | "SURVIVAL"

export class GodCore {
  private bot: PrisonBotLogic

  private dangerLevel = 0
  private currentMode: GodMode = "PASSIVE"

  constructor(bot: PrisonBotLogic) {
    this.bot = bot
  }

  // =========================
  // SIGNAL INPUTS
  // =========================

  public enemyAttackDetected() {
    this.dangerLevel += 3
    this.recalculate()
  }

  public successfulPrison() {
    this.dangerLevel = Math.max(0, this.dangerLevel - 1)
    this.recalculate()
  }

  public calmTick() {
    this.dangerLevel = Math.max(0, this.dangerLevel - 2)
    this.recalculate()
  }

  // =========================
  // MODE DECISION
  // =========================

  private recalculate() {
    let next: GodMode = "PASSIVE"

    if (this.dangerLevel >= 13) next = "SURVIVAL"
    else if (this.dangerLevel >= 8) next = "AGGRESSIVE"
    else if (this.dangerLevel >= 4) next = "BALANCED"

    if (next !== this.currentMode) {
      this.currentMode = next
      this.applyMode(next)
    }
  }

  // =========================
  // APPLY STRATEGY
  // =========================

  private applyMode(mode: GodMode) {
    switch (mode) {
      case "PASSIVE":
        this.bot.updateSettings({
          ...this.bot["settings"],
          disconnectAction: false,
        })
        break

      case "BALANCED":
        this.bot.updateSettings({
          ...this.bot["settings"],
          disconnectAction: false,
        })
        break

      case "AGGRESSIVE":
        this.bot.updateSettings({
          ...this.bot["settings"],
          disconnectAction: true,
        })
        break

      case "SURVIVAL":
        this.bot.updateSettings({
          ...this.bot["settings"],
          disconnectAction: true,
        })
        break
    }
  }

  public getMode() {
    return this.currentMode
  }

  public getDangerLevel() {
    return this.dangerLevel
  }
}
