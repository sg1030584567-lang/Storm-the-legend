// GOD CORE — Phase 7.2
// Orchestrates PrisonBotLogic safely
// NO game logic here (LOCKED)

import { PrisonBotLogic } from "./prison-bot-logic"

export interface GodCoreOptions {
  autoStart?: boolean
}

export class GodCore {
  private bot: PrisonBotLogic
  private running = false

  constructor(bot: PrisonBotLogic, options: GodCoreOptions = {}) {
    this.bot = bot

    if (options.autoStart) {
      this.start()
    }
  }

  /* ================= CONTROL ================= */

  start() {
    if (this.running) return
    this.running = true

    // delegate to bot brain
    this.bot.start()
  }

  stop() {
    if (!this.running) return
    this.running = false
  }

  isRunning() {
    return this.running
  }
}
