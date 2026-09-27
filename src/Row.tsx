import { Accessor, createState } from "ags"
import { Gtk } from "ags/gtk4"

type Text = string | Accessor<string>
export type Action = { label: string; run: () => void; visible?: Accessor<boolean> }

type Props = {
  icon: Text
  title: Text
  detail: Text
  status?: Text
  lock?: boolean
  kind?: Text
  actions?: Action[]
  visible?: Accessor<boolean>
  onClicked?: () => void
}

export default function Row({ icon, title, detail, status = "", lock, kind = "", actions = [], visible, onClicked }: Props) {
  const [hovered, setHovered] = createState(false)
  const rest = (
    <box halign={Gtk.Align.END}>
      <image class="lock" iconName="system-lock-screen-symbolic" visible={!!lock} />
      <label class="status" label={status} />
    </box>
  ) as Gtk.Widget
  const buttons = (
    <box class="actions">
      {actions.map((a) => (
        <button class="ghost" label={a.label} visible={a.visible ?? true} onClicked={a.run} />
      ))}
    </box>
  ) as Gtk.Widget

  return (
    <box class={typeof kind === "string" ? `row ${kind}` : kind((k) => `row ${k}`)} visible={visible ?? true}>
      <Gtk.EventControllerMotion onEnter={() => setHovered(true)} onLeave={() => setHovered(false)} />
      <Gtk.GestureClick onReleased={() => onClicked?.()} />
      <image class="icon" iconName={icon} />
      <box orientation={Gtk.Orientation.VERTICAL} hexpand valign={Gtk.Align.CENTER}>
        <label class="name" label={title} xalign={0} ellipsize={3} />
        <label class="info" label={detail} xalign={0} ellipsize={3} />
      </box>
      <stack
        transitionType={Gtk.StackTransitionType.CROSSFADE}
        transitionDuration={150}
        hhomogeneous={false}
        valign={Gtk.Align.CENTER}
        $={(stack) => {
          stack.add_named(rest, "rest")
          stack.add_named(buttons, "actions")
          hovered.subscribe(() => (stack.visibleChildName = hovered.peek() && actions.length ? "actions" : "rest"))
        }}
      />
    </box>
  )
}
