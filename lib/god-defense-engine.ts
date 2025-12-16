export type EnemyEvent = {
  userId: string
  lastAction: number
  hits: number
}

export class GodDefenseEngine {
  private enemies: Record<string, EnemyEvent> = {}

  registerAttack(userId: string) {
    const now = Date.now()

    if (!this.enemies[userId]) {
      this.enemies[userId] = {
        userId,
        lastAction: now,
        hits: 1,
      }
      return
    }

    this.enemies[userId].lastAction = now
    this.enemies[userId].hits++
  }

  getPriorityTargets(): string[] {
    const now = Date.now()

    return Object.values(this.enemies)
      .filter(e => now - e.lastAction < 60_000) // last 60 sec
      .sort((a, b) => b.hits - a.hits)
      .map(e => e.userId)
  }

  clearEnemy(userId: string) {
    delete this.enemies[userId]
  }

  reset() {
    this.enemies = {}
  }
}
