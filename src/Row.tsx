import { Accessor } from "ags"
import { Gtk } from "ags/gtk4"

type Text = string | Accessor<string>
type Props = {
  icon: Text
  title: Text
  detail: Text
  status?: Text
  kind?: Text
  lock?: boolean
  visible?: boolean | Accessor<boolean>
  actions?: Record<string, () => void>
  onClicked?: () => void
}

export default function Row({ icon, title, detail, status = "", kind = "", lock = false, visible = true, actions = {}, onClicked }: Props) {
  let stack: Gtk.Stack
  const show = (name: string) => () => stack.get_child_by_name(name) && (stack.visibleChildName = name)
  const rest = (
    <box halign={Gtk.Align.END}>
      <image class="lock" iconName="system-lock-screen-symbolic" visible={lock} />
      <label class="status" label={status} />
    </box>
  ) as Gtk.Widget
  const buttons = (
    <box>
      {Object.entries(actions).map(([label, run]) => (
        <button class={`ghost ${label.toLowerCase()}`} label={label} onClicked={run} />
      ))}
    </box>
  ) as Gtk.Widget

  return (
    <box
      class={kind instanceof Accessor ? kind((k) => `row ${k}`) : `row ${kind}`}
      visible={visible}
      $={(self) => onClicked && self.set_cursor_from_name("pointer")}
    >
      <Gtk.EventControllerMotion onEnter={show("actions")} onLeave={show("rest")} />
      <Gtk.GestureClick onReleased={() => onClicked?.()} />
      <image class="icon" iconName={icon} />
      <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER}>
        <label class="name" label={title} xalign={0} ellipsize={3} />
        <label class="info" label={detail} xalign={0} ellipsize={3} />
      </box>
      <stack
        hhomogeneous={false}
        valign={Gtk.Align.CENTER}
        $={(self) => {
          stack = self
          stack.add_named(rest, "rest")
          if (Object.keys(actions).length) stack.add_named(buttons, "actions")
        }}
      />
    </box>
  )
}
