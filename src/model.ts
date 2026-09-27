export type Security = "Open" | "WEP" | "WPA" | "WPA2" | "WPA3" | "Enterprise"
export type AccessPoint = { ssid: string; strength: number; flags: number; wpa: number; rsn: number }
export type Network = { ssid: string; icon: string; security: Security; known: boolean }
export type Link = { ssid: string; name: string; icon: string; detail: string; phase: "connecting" | "connected" }
export type Form = Pick<Network, "ssid" | "security">
export type Notice = { ssid: string; message: string }
export type Pending = { ssid: string; fresh: boolean }
export type State = {
  adapter: boolean
  enabled: boolean
  scanning: boolean
  links: Link[]
  networks: Network[]
  form: Form | null
  notice: Notice | null
  pending: Pending | null
}

const ACTIVATED = 100
const FAILED = 120
const STEPS: Record<number, [stage: number, message: string]> = {
  40: [1, "Preparing..."],
  50: [2, "Configuring..."],
  60: [2, "Authenticating..."],
  70: [3, "Obtaining IP address..."],
  80: [3, "Verifying connection..."],
  90: [3, "Verifying connection..."],
}

export const link = (state: number, up: Omit<Link, "phase">): Link[] =>
  state === ACTIVATED ? [{ ...up, phase: "connected" }]
  : STEPS[state] ? [{ ...up, icon: `nm-panel-stage${STEPS[state][0]}-symbolic`, detail: STEPS[state][1], phase: "connecting" }]
  : []

export const settle = (s: State, state: number, reason: string, ssid: string): State =>
  !s.pending ? s
  : state === FAILED ? { ...s, pending: null, notice: { ssid: s.pending.ssid, message: reason } }
  : state !== ACTIVATED ? s
  : { ...s, pending: null, notice: ssid === s.pending.ssid ? null : { ssid: s.pending.ssid, message: `Connected to ${ssid} instead` } }

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

export const strongest = <T extends { strength: number }>(aps: T[]) => [...aps].sort((a, b) => b.strength - a.strength)

export const keep = <T>(prev: T[], next: T[]) =>
  next.map((n) => prev.find((p) => JSON.stringify(p) === JSON.stringify(n)) ?? n)

export const listNetworks = (aps: AccessPoint[], connected: string, known: Set<string>): Network[] =>
  strongest(aps)
    .filter((ap) => ap.ssid && ap.ssid !== connected)
    .filter((ap, i, all) => all.findIndex((o) => o.ssid === ap.ssid) === i)
    .map((ap) => ({ ssid: ap.ssid, icon: signalIcon(ap.strength), security: security(ap), known: known.has(ap.ssid) }))
    .sort((a, b) => +b.known - +a.known)
