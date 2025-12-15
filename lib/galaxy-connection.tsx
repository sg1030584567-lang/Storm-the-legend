// Galaxy WebSocket connection handler (Browser + Vercel SAFE)

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

  constructor() {}

  /* ================= CALLBACK REG ================= */

  onLog(cb: LogCallback) {
    cb && this.logCallbacks.push(cb)
  }

  onConnected(cb: ConnectedCallback) {
    cb && this.connectedCallbacks.push(cb)
  }

  onDisconnected(cb: DisconnectedCallback) {
    cb && this.disconnectedCallbacks.push(cb)
  }

  onUserJoin(cb: UserJoinCallback) {
    cb && this.userJoinCallbacks.push(cb)
  }

  onUserPart(cb: UserPartCallback) {
    cb && this.userPartCallbacks.push(cb)
  }

  onAuthenticated(cb: AuthenticatedCallback) {
    cb && this.authenticatedCallbacks.push(cb)
  }

  onPlanetJoined(cb: PlanetJoinedCallback) {
    cb && this.planetJoinedCallbacks.push(cb)
  }

  onAfterAction(cb: AfterActionCallback) {
    cb && this.afterActionCallbacks.push(cb)
  }

  /* ================= INTERNAL ================= */

  private log(msg: string) {
    console.log("[Galaxy]", msg)
    this.logCallbacks.forEach(cb => cb(msg))
  }

  private send(cmd: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(cmd + "\r\n")
    }
  }

  /* ================= MESSAGE ================= */

  private receive(data: string) {
    const lines = data.split("\r\n")

    for (const line of lines) {
      if (!line.trim()) continue

      const parts = line.split(/\s+/)
      const cmd = parts[0]
      const payload = line.includes(":")
        ? line.substring(line.indexOf(":") + 1)
        : ""

      switch (cmd) {
        case "PING":
          this.send("PONG")
          break

        case "HAAAPSI":
          this.hash = this.makeHash(parts[1])
          this.send("RECOVER " + this.recover)
          break

        case "999":
          this.authenticated = true
          this.authenticatedCallbacks.forEach(cb => cb())
          break

        case "REGISTER":
          this.myUserId = parts[1]
          this.send(`USER ${parts[1]} ${parts[2]} ${parts[3]} ${this.hash}`)
          break

        case "900":
          this.planetJoinedCallbacks.forEach(cb => cb())
          break

        case "JOIN":
          this.handleJoin(parts)
          break

        case "353":
          this.handleUserList(payload)
          break

        case "PART":
        case "SLEEP":
          this.userPartCallbacks.forEach(cb => cb(parts[1]))
          break

        case "451":
        case "452":
          this.disconnect()
          break
      }
    }
  }

  /* ================= PARSERS ================= */

  private handleJoin(parts: string[]) {
    try {
      let nick = ""
      let id = ""
      let clan = ""

      if (parts[1] === "-") {
        nick = parts[2]
        id = parts[3]
        for (const p of parts) {
          if (p.startsWith("[") && p.endsWith("]")) {
            clan = p.slice(1, -1)
            break
          }
        }
      } else {
        nick = parts[1]
        id = parts[2]
      }

      if (id && id !== this.myUserId) {
        this.userJoinCallbacks.forEach(cb =>
          cb({ id, nick, clan, level: "1" })
        )
      }
    } catch {}
  }

  private handleUserList(list: string) {
    const p = list.split(" ")
    for (let i = 0; i < p.length - 1; i++) {
      if (/^\d+$/.test(p[i + 1]) && p[i + 1] !== this.myUserId) {
        this.userJoinCallbacks.forEach(cb =>
          cb({ id: p[i + 1], nick: p[i], clan: "", level: "1" })
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

    this.socket.onerror = () => this.disconnect()
    this.socket.onmessage = e => this.receive(e.data)
  }

  disconnect() {
    try {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send("QUIT :disconnect")
      }
      this.socket?.close()
    } catch {}
    this.socket = null
    this.authenticated = false
  }

  /* ================= GAME ================= */

  joinPlanet(name: string) {
    this.authenticated && this.send("JOIN " + name)
  }

  prisonUser(userId: string) {
    if (!this.authenticated) return
    this.send("ACTION 3 " + userId)
    setTimeout(() => {
      this.afterActionCallbacks.forEach(cb => cb())
    }, 300)
  }

  standOnUser(userId: string) {
    this.authenticated && this.send("FLY " + userId)
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
  // Browser-safe deterministic hash (crypto-free)
  private makeHash(seed: string) {
    let h = 0
    for (let i = 0; i < seed.length; i++) {
      h = (h << 5) - h + seed.charCodeAt(i)
      h |= 0
    }
    return Math.abs(h).toString(16)
  }
}
