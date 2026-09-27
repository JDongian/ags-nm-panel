import { For } from "ags"
import app from "ags/gtk4/app"
import { Astal, Gdk, Gtk } from "ags/gtk4"
import { exec } from "ags/process"
import Graphene from "gi://Graphene"
import Row from "./Row"
import type { NetworkService } from "./network"

const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor
const { VERTICAL } = Gtk.Orientation
const WIDTH = 382
const NO_FORM = { ssid: "", security: "Open" } as const
const NO_NOTICE = { ssid: "", message: "" }
const EMPTY = {
  adapter: ["network-wireless-hardware-disabled-symbolic", "No WiFi Adapter", "No wireless adapter was detected on this system"],
  off: ["network-wireless-disabled-symbolic", "WiFi is Off", "Turn on WiFi to see networks"],
  none: ["network-wireless-offline-symbolic", "No Networks Found", "Try scanning again"],
  hidden: ["", "", ""],
}

export default function Panel(net: NetworkService) {
  const { state } = net
  const links = state((s) => s.links)
  const form = state((s) => s.form ?? NO_FORM)
  const notice = state((s) => s.notice ?? NO_NOTICE)
  const empty = state((s) =>
    !s.adapter ? EMPTY.adapter : !s.enabled ? EMPTY.off : s.networks.length ? EMPTY.hidden : EMPTY.none,
  )
  let win: Astal.Window
  let entry: Gtk.PasswordEntry
  let content: Gtk.Box

  const toggled = () => {
    if (!win.visible) return net.dismiss()
    const { x } = JSON.parse(exec("hyprctl cursorpos -j"))
    content.marginStart = Math.max(0, Math.min(x - WIDTH / 2, app.monitors[0].geometry.width - WIDTH))
    net.scan()
  }

  const clicked = (_: Gtk.GestureClick, _n: number, x: number, y: number) => {
    const [, bounds] = content.compute_bounds(win)
    if (!bounds.contains_point(new Graphene.Point({ x, y }))) win.hide()
  }

  const submit = () => {
    net.connect(form.peek(), entry.text)
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
          <button class="open" label="Open Network Manager" onClicked={net.editor} />
          <button class="open" label="ⓘ" onClicked={net.info} />
          <box hexpand />
          <button
            class={state((s) => (s.scanning ? "ghost scanning" : "ghost"))}
            iconName="view-refresh-symbolic"
            visible={state((s) => s.adapter && s.enabled)}
            sensitive={state((s) => !s.scanning)}
            onClicked={net.scan}
          />
          <switch
            valign={Gtk.Align.CENTER}
            visible={state((s) => s.adapter)}
            active={state((s) => s.enabled)}
            onNotifyActive={(self) => net.enable(self.active)}
          />
        </box>

        <label class="section" label="Notice" visible={state((s) => !!s.notice)} xalign={0} />
        <box class="group" visible={state((s) => !!s.notice)}>
          <Row
            kind="error"
            icon="dialog-warning-symbolic"
            title={notice((n) => n.ssid)}
            detail={notice((n) => n.message)}
            actions={{ Dismiss: net.dismiss }}
            onClicked={() => net.edit(notice.peek().ssid)}
          />
        </box>

        <label
          class="section"
          label={links((l) => (l.length > 1 ? "Active Connections" : "Active Connection"))}
          visible={links((l) => l.length > 0)}
          xalign={0}
        />
        <box class="group" orientation={VERTICAL} visible={links((l) => l.length > 0)}>
          <For each={links}>
            {(l) => (
              <Row
                kind={l.phase}
                icon={l.icon}
                title={l.name}
                detail={l.detail}
                status={l.phase === "connected" ? "Connected" : "Connecting"}
                actions={l.ssid ? { [l.phase === "connected" ? "Disconnect" : "Cancel"]: net.disconnect } : {}}
                onClicked={() => net.edit(l.ssid)}
              />
            )}
          </For>
        </box>

        <label class="section" label="Available Networks" visible={state((s) => s.adapter)} xalign={0} />
        <box
          class="group form"
          orientation={VERTICAL}
          visible={state((s) => !!s.form)}
          onNotifyVisible={(self) => (self.visible ? entry.grab_focus() : (entry.text = ""))}
        >
          <Row icon="network-wireless-symbolic" title={form((f) => f.ssid)} detail={form((f) => f.security)} />
          <Gtk.PasswordEntry $={(self) => (entry = self)} showPeekIcon placeholderText="Enter password" onActivate={submit} />
          <box halign={Gtk.Align.END}>
            <button class="ghost" label="Cancel" onClicked={net.dismiss} />
            <button class="primary" label="Connect" onClicked={submit} />
          </box>
        </box>

        <box class="empty" orientation={VERTICAL} vexpand valign={Gtk.Align.CENTER} visible={empty((e) => e !== EMPTY.hidden)}>
          <image iconName={empty((e) => e[0])} />
          <label class="empty-name" label={empty((e) => e[1])} />
          <label class="empty-hint" label={empty((e) => e[2])} wrap justify={Gtk.Justification.CENTER} />
        </box>

        <scrolledwindow class="group" vexpand hscrollbarPolicy={Gtk.PolicyType.NEVER} visible={empty((e) => e === EMPTY.hidden)}>
          <box orientation={VERTICAL}>
            <For each={state((s) => s.networks.filter((n) => n.ssid !== s.form?.ssid))}>
              {(n) => (
                <Row
                  icon={n.icon}
                  title={n.ssid}
                  detail={n.security}
                  status={n.known ? "Saved" : ""}
                  lock={n.security !== "Open" && !n.known}
                  actions={n.known ? { Forget: () => net.forget(n.ssid) } : {}}
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
