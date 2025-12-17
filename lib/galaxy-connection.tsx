// Galaxy WebSocket connection handler (IRC-like protocol)
// LOCKED FINAL VERSION — Stable & Bot-safe (Phase 7.2)

export interface UserData {
  id: string
  nick: string
  clan: string
  level: string
}

type LogCallback = (message: string) => void
type ConnectedCallback = () => void
type DisconnectedCallback = () => void
type UserJoinCallback = (user: UserData) => void
type UserPartCallback = (userId: string) => void
type AuthenticatedCallback = () => void
type PlanetJoinedCallback = () => void
type AfterActionCallback = () => void
type EnemyPrisonCallback = (enemyId: string) => void

export class GalaxyConnection {
  private socket: WebSocket | null = null
  private authenticated = false
  private recover = ""
  private hash = ""
  private myUserId = ""

  /* ================= CALLBACKS ================= */

  private logCallbacks: LogCallback[] = []
  private connectedCallbacks: ConnectedCallback[] = []
  private disconnectedCallbacks: DisconnectedCallback[] = []
  private userJoinCallbacks: UserJoinCallback[] = []
  private userPartCallbacks: UserPartCallback[] = []
  private authenticatedCallbacks: AuthenticatedCallback[] = []
  private planetJoinedCallbacks: PlanetJoinedCallback[] = []
  private afterActionCallbacks: AfterActionCallback[] = []
  private enemyPrisonCallbacks: EnemyPrisonCallback[] = []

  /* ================= REGISTRATION ================= */

  onLog(cb: LogCallback) {
    this.logCallbacks.push(cb)
  }

  onConnected(cb: ConnectedCallback) {
    this.connectedCallbacks.push(cb)
  }

  onDisconnected(cb: DisconnectedCallback) {
    this.disconnectedCallbacks.push(cb)
  }

  onUserJoin(cb: UserJoinCallback) {
    this.userJoinCallbacks.push(cb)
  }

  onUserPart(cb: UserPartCallback) {
    this.userPartCallbacks.push(cb)
  }

  onAuthenticated(cb: AuthenticatedCallback) {
    this.authenticatedCallbacks.push(cb)
  }

  onPlanetJoined(cb: PlanetJoinedCallback) {
    this.planetJoinedCallbacks.push(cb)
  }

  onAfterAction(cb: AfterActionCallback) {
    this.afterActionCallbacks.push(cb)
  }

  onEnemyPrison(cb: EnemyPrisonCallback) {
    this.enemyPrisonCallbacks.push(cb)
  }

  /* ================= INTERNAL ================= */

  private log(msg: string) {
    console.log("[Galaxy]", msg)
    this.logCallbacks.forEach(cb => cb(msg))
  }

  private send(str: string) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(str + "\r\n")
    }
  }

  /* ================= MESSAGE HANDLER ================= */

  private receive(data: string) {
    const lines = data.replace(/\r\n$/, "").split("\r\n")

    for (const line of lines) {
      if (!line.trim()) continue

      const parts = line.split(/\s+/)
      const command = parts[0]
      const colonIndex = line.indexOf(":")
      const content =
        colonIndex !== -1 ? line.substring(colonIndex + 1).trim() : ""

      switch (command) {
        case "PING":
          this.send("PONG")
          break

        case "HAAAPSI":
          this.send("RECOVER " + this.recover)
          this.hash = this.genHash(parts[1])
          break

        case "999":
          this.authenticated = true
          this.authenticatedCallbacks.forEach(cb => cb())
          break

        case "REGISTER":
          this.myUserId = parts[1]
          this.send(
            `USER ${parts[1]} ${parts[2]} ${parts[3]} ${this.hash}`
          )
          break

        case "900":
          this.planetJoinedCallbacks.forEach(cb => cb())
          break

        case "JOIN":
          this.parseJoin(parts)
          break

        case "353":
          this.parseUserList(content)
          break

        case "PART":
        case "SLEEP":
          this.userPartCallbacks.forEach(cb => cb(parts[1]))
          break

        case "ACTION": {
          const actionType = parts[1]
          const targetId = parts[2]

          // ACTION 3 = PRISON
          if (actionType === "3" && targetId !== this.myUserId) {
            this.enemyPrisonCallbacks.forEach(cb => cb(targetId))
          }
          break
        }

        case "451":
        case "452":
          this.disconnect()
          break
      }
    }
  }

  /* ================= PARSERS ================= */

  private parseJoin(parts: string[]) {
    try {
      let nick = ""
      let userId = ""
      let clan = ""

      if (parts[1] === "-") {
        nick = parts[2]
        userId = parts[3]
        for (let i = 4; i < parts.length; i++) {
          if (parts[i]?.startsWith("[") && parts[i].endsWith("]")) {
            clan = parts[i].slice(1, -1)
            break
          }
        }
      } else {
        nick = parts[1]
        userId = parts[2]
      }

      if (userId && userId !== this.myUserId) {
        this.userJoinCallbacks.forEach(cb =>
          cb({ id: userId, nick, clan, level: "1" })
        )
      }
    } catch {}
  }

  private parseUserList(content: string) {
    const parts = content.split(" ")
    for (let i = 0; i < parts.length - 1; i++) {
      if (/^\d+$/.test(parts[i + 1]) && parts[i + 1] !== this.myUserId) {
        this.userJoinCallbacks.forEach(cb =>
          cb({
            id: parts[i + 1],
            nick: parts[i],
            clan: "",
            level: "1",
          })
        )
      }
    }
  }

  /* ================= CONNECTION ================= */

  connect(recoveryCode: string) {
    this.recover = recoveryCode
    this.authenticated = false

    this.socket = new WebSocket("wss://cs.mobstudio.ru:6672/")

    this.socket.onopen = () => {
      this.send(":ru IDENT 352 -2 4030 1 2 :GALA")
      this.connectedCallbacks.forEach(cb => cb())
    }

    this.socket.onclose = () => {
      this.authenticated = false
      this.disconnectedCallbacks.forEach(cb => cb())
    }

    this.socket.onerror = () => {
      this.disconnect()
    }

    this.socket.onmessage = e => this.receive(e.data)
  }

  disconnect() {
    if (!this.socket) return
    try {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.send("QUIT :disconnect")
      }
      this.socket.close()
    } catch {}
    this.socket = null
    this.authenticated = false
  }

  /* ================= GAME ACTIONS ================= */

  joinPlanet(name: string) {
    if (this.authenticated) {
      this.send("JOIN " + name)
    }
  }

  prisonUser(userId: string) {
    if (!this.authenticated) return

    this.send("ACTION 3 " + userId)

    // notify bot AFTER server-side delay
    setTimeout(() => {
      this.afterActionCallbacks.forEach(cb => cb())
    }, 300)
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN
  }

  isAuthenticated() {
    return this.authenticated
  }

  getMyUserId() {
    return this.myUserId
  }

  /* ================= HASH ================= */

  private genHash(code: string): string {
    const md5 = this.md5(code)
    return md5.split("").reverse().join("0").substr(5, 10)
  }

  private md5(str: string): string {
    return require("crypto")
      .createHash("md5")
      .update(str)
      .digest("hex")
  }
}
