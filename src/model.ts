export type Security = "Open" | "WEP" | "WPA" | "WPA2" | "WPA3" | "Enterprise"

export type AccessPoint = {
  ssid: string
  path: string
  strength: number
  flags: number
  wpa: number
  rsn: number
}

export type Network = {
  ssid: string
  path: string
  strength: number
  security: Security
  known: boolean
}

export type Link = { ip: string; detail: string }

export type Attempt = {
  ssid: string
  security: Security
  path: string
  phase: "password" | "connecting" | "error"
  message: string
}

export type State = {
  enabled: boolean
  scanning: boolean
  wifi: (Link & { ssid: string; strength: number }) | null
  wired: Link | null
  networks: Network[]
  attempt: Attempt | null
}

export const STEPS: Record<number, string> = {
  40: "Preparing...",
  50: "Configuring...",
  60: "Authenticating...",
  70: "Obtaining IP address...",
  80: "Verifying connection...",
  90: "Verifying connection...",
}
export const ACTIVATED = 100
export const FAILED = 120

const PSK = 0x100
const ENTERPRISE = 0x200 | 0x2000
const SAE = 0x400

export const security = (ap: AccessPoint): Security =>
  (ap.wpa | ap.rsn) & ENTERPRISE ? "Enterprise"
  : ap.rsn & PSK ? "WPA2"
  : ap.rsn & SAE ? "WPA3"
  : ap.wpa & PSK ? "WPA"
  : ap.flags & 1 ? "WEP"
  : "Open"

export const signalIcon = (strength: number) =>
  `network-wireless-signal-${["none", "weak", "ok", "good", "excellent"][Math.min(4, Math.floor(strength / 20))]}-symbolic`

export const band = (mhz: number) =>
  mhz < 2500 ? "2.4 GHz" : mhz < 5900 ? "5 GHz" : mhz < 7125 ? "6 GHz" : "60 GHz"

export const speed = (mbps: number) =>
  mbps < 1000 ? `${mbps} Mbps` : `${+(mbps / 1000).toFixed(1)} Gbps`

export function listNetworks(aps: AccessPoint[], connected: string | undefined, known: Set<string>, previous: Network[]) {
  const best = new Map<string, Network>()
  for (const ap of aps) {
    const sec = security(ap)
    if (!ap.ssid || ap.ssid === connected) continue
    if ((best.get(ap.ssid)?.strength ?? -1) < ap.strength)
      best.set(ap.ssid, { ssid: ap.ssid, path: ap.path, strength: ap.strength, security: sec, known: known.has(ap.ssid) })
  }
  const old = new Map(previous.map((n) => [n.ssid, n]))
  return [...best.values()]
    .sort((a, b) => b.strength - a.strength)
    .map((n) => {
      const p = old.get(n.ssid)
      return p && p.known === n.known && p.security === n.security && signalIcon(p.strength) === signalIcon(n.strength)
        ? Object.assign(p, { path: n.path })
        : n
    })
}
