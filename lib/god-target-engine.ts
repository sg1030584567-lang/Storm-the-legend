// lib/god-target-engine.ts
// PHASE 2 — Smart Target Engine (Priority + Rotation)

export interface TargetMeta {
  id: string
  priority: number
  lastHit: number
}

export class GodTargetEngine {
  private targets = new Map<string, TargetMeta>()
  private cooldownMs = 4000

  /* ================= TARGET MGMT ================= */

  addTarget(id: string, priority = 1) {
    if (!this.targets.has(id)) {
      this.targets.set(id, {
        id,
        priority,
        lastHit: 0,
      })
    }
  }

  removeTarget(id: string) {
    this.targets.delete(id)
  }

  clear() {
    this.targets.clear()
  }

  /* ================= CORE LOGIC ================= */

  getNextTarget(): string | null {
    const now = Date.now()

    const available = Array.from(this.targets.values())
      .filter(t => now - t.lastHit > this.cooldownMs)
      .sort((a, b) => b.priority - a.priority)

    if (available.length === 0) return null

    const chosen = available[0]
    chosen.lastHit = now

    return chosen.id
  }

  /* ================= DEBUG ================= */

  getAllTargets() {
    return Array.from(this.targets.values())
  }
}
