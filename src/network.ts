import NM from "gi://NM"
import { createState } from "ags"
import app from "ags/gtk4/app"
import { execAsync } from "ags/process"
import { interval, timeout } from "ags/time"
import { band, keep, link, listNetworks, settle, signalIcon, speed, strongest, type Form, type Network, type State } from "./model"

const text = (bytes: any) => (bytes ? new TextDecoder().decode(bytes.get_data()) : "")
const ssidOf = (c?: NM.Connection | null) => text(c?.get_setting_wireless()?.get_ssid())
const ip = (dev: NM.Device) => dev.get_ip4_config()?.get_addresses()[0]?.get_address() ?? ""
const reason = (code: number) => Object.entries(NM.DeviceStateReason).find(([, v]) => v === code)![0]
const hide = () => app.get_window("network")!.hide()
const open = (...command: string[]) => (execAsync(command), hide())

export type NetworkService = ReturnType<typeof createNetwork>

export function createNetwork() {
  const client = NM.Client.new(null)
  const find = (type: NM.DeviceType) => client.get_devices().find((d) => d.deviceType === type)
  const wifi = find(NM.DeviceType.WIFI) as NM.DeviceWifi | undefined
  const wired = find(NM.DeviceType.ETHERNET) as NM.DeviceEthernet | undefined
  const points = () => wifi?.get_access_points() ?? []
  const joining = () => ssidOf(wifi?.get_active_connection()?.get_connection())
  const saved = (ssid: string) => client.get_connections().filter((c) => ssidOf(c) === ssid)
  const forget = (ssid: string) => saved(ssid).forEach((c) => c.delete_async(null, null))

  const read = (prev?: State): State => {
    const ap = wifi?.get_active_access_point()
    const ssid = joining()
    const aps = points().map((a) => ({ ssid: text(a.get_ssid()), strength: a.strength, flags: a.flags, wpa: a.wpaFlags, rsn: a.rsnFlags }))
    const known = new Set(client.get_connections().map(ssidOf))
    return {
      adapter: !!wifi,
      enabled: client.wirelessEnabled,
      scanning: prev?.scanning ?? false,
      form: prev?.form ?? null,
      notice: prev?.notice ?? null,
      pending: prev?.pending ?? null,
      links: keep(prev?.links ?? [], [
        ...(wired ? link(wired.state, { ssid: "", name: "Ethernet", icon: "network-wired-symbolic", detail: `${ip(wired)} - ${speed(wired.speed)}` }) : []),
        ...(wifi ? link(wifi.state, { ssid, name: ssid, icon: signalIcon(ap?.strength ?? 0), detail: `${ip(wifi)} - ${band(ap?.frequency ?? 0)}` }) : []),
      ]),
      networks: keep(prev?.networks ?? [], client.wirelessEnabled ? listNetworks(aps, ssid, known) : []),
    }
  }

  const [state, setState] = createState(read())
  const patch = (p: Partial<State>) => setState((s) => ({ ...s, ...p }))
  const refresh = () => setState(read)

  for (const signal of ["notify::wireless-enabled", "connection-added", "connection-removed"]) client.connect(signal, refresh)
  for (const signal of ["access-point-added", "access-point-removed", "notify::active-access-point", "notify::ip4-config"])
    wifi?.connect(signal, refresh)
  wired?.connect("notify::state", refresh)
  wifi?.connect("notify::last-scan", () => patch({ scanning: false }))
  interval(3000, refresh)

  wifi?.connect("state-changed", (_, next: number, _old: number, code: number) => {
    const before = state.peek()
    const after = settle(before, next, reason(code), joining())
    if (before.pending && !after.pending && !after.notice) hide()
    if (before.pending?.fresh && after.notice) forget(before.pending.ssid)
    setState(() => read(after))
  })

  const connect = (net: Form, password?: string) => {
    const [profile] = saved(net.ssid)
    const [point] = strongest(points().filter((a) => text(a.get_ssid()) === net.ssid))
    patch({ pending: { ssid: net.ssid, fresh: !profile }, form: null, notice: null })
    if (profile) return client.activate_connection_async(profile, wifi, point.get_path(), null, null)
    const conn = NM.SimpleConnection.new()
    if (password)
      conn.add_setting(new NM.SettingWirelessSecurity({ keyMgmt: net.security === "WPA3" ? "sae" : "wpa-psk", psk: password }))
    client.add_and_activate_connection_async(conn, wifi, point.get_path(), null, null)
  }

  return {
    state,
    connect,
    forget,
    select: (net: Network) =>
      net.security === "Open" || net.known ? connect(net)
      : net.security === "Enterprise" ? open("nm-connection-editor")
      : patch({ form: { ssid: net.ssid, security: net.security }, notice: null }),
    dismiss: () => patch({ form: null, notice: null }),
    disconnect: () => {
      const { pending } = state.peek()
      patch({ pending: null })
      wifi!.disconnect_async(null, null)
      if (pending?.fresh) forget(pending.ssid)
    },
    enable: (on: boolean) => (client.wirelessEnabled = on),
    info: () => open("ags-nm-panel-info"),
    editor: () => open("nm-connection-editor"),
    edit: (ssid: string) => {
      const uuid = (ssid ? saved(ssid)[0] : wired?.get_active_connection())?.get_uuid()
      open("nm-connection-editor", ...(uuid ? ["--edit", uuid] : []))
    },
    scan: () => {
      if (!wifi || !client.wirelessEnabled) return
      patch({ scanning: true })
      wifi.request_scan_async(null, null)
      timeout(30000, () => patch({ scanning: false }))
    },
  }
}
