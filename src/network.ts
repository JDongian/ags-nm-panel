import NM from "gi://NM"
import { createState } from "ags"
import app from "ags/gtk4/app"
import { execAsync } from "ags/process"
import { interval } from "ags/time"
import { ACTIVATED, FAILED, STEPS, band, listNetworks, speed, type Network, type State } from "./model"

const text = (bytes: any) => (bytes ? new TextDecoder().decode(bytes.get_data()) : "")
const ip = (dev: NM.Device) => dev.get_ip4_config()?.get_addresses()[0]?.get_address() ?? ""
const active = (dev?: NM.Device) => dev?.state === NM.DeviceState.ACTIVATED

export type NetworkService = ReturnType<typeof createNetwork>

export function createNetwork() {
  const client = NM.Client.new(null)
  const find = (type: NM.DeviceType) => client.get_devices().find((d) => d.deviceType === type)
  const wifi = find(NM.DeviceType.WIFI) as NM.DeviceWifi
  const wired = find(NM.DeviceType.ETHERNET) as NM.DeviceEthernet

  const saved = (ssid: string) =>
    client.get_connections().filter((c) => text(c.get_setting_wireless()?.get_ssid()) === ssid)

  const read = (prev?: State): State => {
    const ap = active(wifi) ? wifi.get_active_access_point() : null
    const ssid = text(ap?.get_ssid())
    const known = new Set(client.get_connections().map((c) => text(c.get_setting_wireless()?.get_ssid())))
    const aps = wifi.get_access_points().map((a) => ({
      ssid: text(a.get_ssid()),
      path: a.get_path(),
      strength: a.strength,
      flags: a.flags,
      wpa: a.wpaFlags,
      rsn: a.rsnFlags,
    }))
    return {
      enabled: client.wirelessEnabled,
      scanning: prev?.scanning ?? false,
      attempt: prev?.attempt ?? null,
      wifi: ap ? { ssid, strength: ap.strength, ip: ip(wifi), detail: band(ap.frequency) } : null,
      wired: active(wired) ? { ip: ip(wired), detail: speed(wired.speed) } : null,
      networks: client.wirelessEnabled ? listNetworks(aps, ssid, known, prev?.networks ?? []) : [],
    }
  }

  let fresh = ""
  const [state, setState] = createState(read())
  const patch = (p: Partial<State>) => setState((s) => ({ ...s, ...p }))
  const refresh = () => setState(read)

  client.connect("notify::wireless-enabled", refresh)
  client.connect("connection-added", refresh)
  client.connect("connection-removed", refresh)
  wifi.connect("access-point-added", refresh)
  wifi.connect("access-point-removed", refresh)
  wifi.connect("notify::active-access-point", refresh)
  wifi.connect("notify::ip4-config", refresh)
  wifi.connect("notify::last-scan", () => patch({ scanning: false }))
  wired.connect("notify::state", refresh)
  interval(3000, refresh)

  const forget = (ssid: string) => saved(ssid).forEach((c) => c.delete_async(null, null))
  const reasons = Object.entries(NM.DeviceStateReason)

  wifi.connect("state-changed", (_, next: number, _old: number, reason: number) => {
    const attempt = state.peek().attempt
    if (attempt?.phase === "connecting") {
      if (next === ACTIVATED) {
        patch({ attempt: null })
        app.get_window("network")!.hide()
      } else if (next === FAILED) {
        patch({ attempt: { ...attempt, phase: "error", message: reasons.find(([, v]) => v === reason)![0] } })
        if (fresh === attempt.ssid) forget(fresh)
      } else if (STEPS[next]) patch({ attempt: { ...attempt, message: STEPS[next] } })
    }
    refresh()
  })

  function connect(net: Pick<Network, "ssid" | "path" | "security">, password?: string) {
    patch({ attempt: { ...net, phase: "connecting", message: STEPS[40] } })
    const [profile] = saved(net.ssid)
    fresh = profile ? "" : net.ssid
    if (profile) return client.activate_connection_async(profile, wifi, net.path, null, null)
    const conn = NM.SimpleConnection.new()
    if (password)
      conn.add_setting(new NM.SettingWirelessSecurity({ keyMgmt: net.security === "WPA3" ? "sae" : "wpa-psk", psk: password }))
    client.add_and_activate_connection_async(conn, wifi, net.path, null, null)
  }

  return {
    state,
    connect,
    select: (net: Network) =>
      net.security === "Open" || net.known
        ? connect(net)
        : net.security === "Enterprise"
          ? execAsync("nm-connection-editor")
          : patch({ attempt: { ...net, phase: "password", message: "" } }),
    dismiss: () => patch({ attempt: null }),
    enable: (on: boolean) => (client.wirelessEnabled = on),
    scan: () => (patch({ scanning: true }), wifi.request_scan_async(null, null)),
    disconnect: () => wifi.disconnect_async(null, null),
    forget,
  }
}
