import Gio from "gi://Gio"
import GLib from "gi://GLib"
import { Service, iface, method, property, signal } from "ags/dbus"
import { Accessor } from "ags"
import { trayIcon, trayTip, type State } from "./model"

@iface("org.kde.StatusNotifierItem")
class Item extends Service {
  @property("s") Category = "Hardware"
  @property("s") Id = "ags-nm-panel"
  @property("s") Title = "Network"
  @property("s") Status = "Active"
  @property("s") IconName = ""
  @property("s") IconThemePath = `${GLib.get_system_data_dirs()[0]}/icons`
  @property("(sa(iiay)ss)") ToolTip: [string, never[], string, string] = ["", [], "Network", ""]
  @signal() NewIcon() {}
  @signal() NewToolTip() {}
  @method("i", "i") Activate(x: number) {
    this.clicked(x)
  }
  @method("i", "i") ContextMenu(x: number) {
    this.clicked(x)
  }

  constructor(private clicked: (x: number) => void) {
    super()
  }
}

export default async function tray(state: Accessor<State>, clicked: (x: number) => void) {
  const name = `org.kde.StatusNotifierItem-${new Gio.Credentials().get_unix_pid()}-1`
  const item = await new Item(clicked).serve({ name, objectPath: "/StatusNotifierItem" })
  const update = () => {
    item.IconName = trayIcon(state.peek())
    item.ToolTip = ["", [], "Network", trayTip(state.peek())]
    item.NewIcon()
    item.NewToolTip()
  }
  update()
  state.subscribe(update)
  Gio.DBus.session.call(
    "org.kde.StatusNotifierWatcher", "/StatusNotifierWatcher", "org.kde.StatusNotifierWatcher",
    "RegisterStatusNotifierItem", new GLib.Variant("(s)", [name]), null, 0, -1, null, null,
  )
}
