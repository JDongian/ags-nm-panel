import { For } from "ags"
import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { exec } from "ags/process"
import Graphene from "gi://Graphene"
import Row from "./Row"
import { signalIcon } from "./model"
import type { NetworkService } from "./network"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
const WIDTH = 382
const VERTICAL = Gtk.Orientation.VERTICAL

export default function Panel(net: NetworkService) {
  const { state } = net
  const attempt = state((s) => (s.attempt?.phase === "password" ? null : s.attempt))
  const form = state((s) => (s.attempt?.phase === "password" ? s.attempt : null))
  let win: Astal.Window
  let entry: Gtk.PasswordEntry
  let content: Gtk.Box

  const toggled = () => {
    if (!win.visible) return state.peek().attempt?.phase === "password" && net.dismiss()
    const { x } = JSON.parse(exec("hyprctl cursorpos -j"))
    content.marginStart = Math.max(0, Math.min(x - WIDTH / 2, app.monitors[0].geometry.width - WIDTH))
    net.scan()
  }

  const clicked = (_: Gtk.GestureClick, _n: number, x: number, y: number) => {
    const [, bounds] = content.compute_bounds(win)
    if (!bounds.contains_point(new Graphene.Point({ x, y }))) win.hide()
  }

  const submit = () => {
    net.connect(state.peek().attempt!, entry.text)
    entry.text = ""
  }

  return (
    <window
      $={(self) => (win = self)}
      name="network"
      namespace="ags-nm-panel"
      class="backdrop"
      anchor={TOP | BOTTOM | LEFT | RIGHT}
      keymode={Astal.Keymode.EXCLUSIVE}
      application={app}
      onNotifyVisible={toggled}
    >
      <Gtk.EventControllerKey onKeyPressed={(_, key) => key === Gdk.KEY_Escape && win.hide()} />
      <Gtk.GestureClick onPressed={clicked} />
      <box
        $={(self) => (content = self)}
        class="netpanel"
        orientation={VERTICAL}
        halign={Gtk.Align.START}
        valign={Gtk.Align.START}
        widthRequest={WIDTH}
        heightRequest={512}
      >
        <box class="header">
          <image iconName="network-wireless-symbolic" />
          <label class="head" label="Network" hexpand xalign={0} />
          <button
            class={state((s) => (s.scanning ? "ghost scan scanning" : "ghost scan"))}
            iconName="view-refresh-symbolic"
            onClicked={net.scan}
          />
          <switch
            valign={Gtk.Align.CENTER}
            active={state((s) => s.enabled)}
            onNotifyActive={(self) => net.enable(self.active)}
          />
        </box>

        <label class="section" label="Active Connection" xalign={0} />
        <box class="group" orientation={VERTICAL}>
          <Row
            visible={state((s) => !!s.wired)}
            icon="network-wired-symbolic"
            title="Ethernet"
            detail={state((s) => `${s.wired?.ip} - ${s.wired?.detail}`)}
            status="Connected"
          />
          <Row
            visible={state((s) => !!s.wifi && !s.attempt)}
            icon={state((s) => signalIcon(s.wifi?.strength ?? 0))}
            title={state((s) => s.wifi?.ssid ?? "")}
            detail={state((s) => `${s.wifi?.ip} - ${s.wifi?.detail}`)}
            status="Connected"
            actions={[
              { label: "Disconnect", run: net.disconnect },
              { label: "Forget", run: () => net.forget(state.peek().wifi!.ssid) },
            ]}
          />
          <Row
            visible={attempt(Boolean)}
            kind={attempt((a) => a?.phase ?? "")}
            icon="network-wireless-acquiring-symbolic"
            title={attempt((a) => a?.ssid ?? "")}
            detail={attempt((a) => a?.message ?? "")}
            status={attempt((a) => (a?.phase === "error" ? "Error" : "Connecting"))}
            actions={[{ label: "Dismiss", run: net.dismiss }]}
          />
        </box>

        <label class="section" label="Available Networks" xalign={0} />
        <box
          class="group form"
          orientation={VERTICAL}
          visible={form(Boolean)}
          onNotifyVisible={(self) => self.visible && entry.grab_focus()}
        >
          <Row
            icon="network-wireless-symbolic"
            title={form((f) => f?.ssid ?? "")}
            detail={form((f) => f?.security ?? "")}
          />
          <Gtk.PasswordEntry
            $={(self) => (entry = self)}
            showPeekIcon
            placeholderText="Enter password"
            onActivate={submit}
          />
          <box halign={Gtk.Align.END}>
            <button class="ghost" label="Cancel" onClicked={net.dismiss} />
            <button class="primary" label="Connect" onClicked={submit} />
          </box>
        </box>

        <scrolledwindow class="group" vexpand hscrollbarPolicy={Gtk.PolicyType.NEVER}>
          <box orientation={VERTICAL}>
            <For each={state((s) => s.networks)}>
              {(n) => (
                <Row
                  icon={signalIcon(n.strength)}
                  title={n.ssid}
                  detail={n.security}
                  status={n.known ? "Saved" : ""}
                  lock={n.security !== "Open" && !n.known}
                  actions={n.known ? [{ label: "Forget", run: () => net.forget(n.ssid) }] : []}
                  onClicked={() => net.select(n)}
                />
              )}
            </For>
          </box>
        </scrolledwindow>
      </box>
    </window>
  )
}
