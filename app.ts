import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import style from "./src/style.scss"
import Panel from "./src/Panel"
import { createNetwork } from "./src/network"
import tray from "./src/tray"

const theme = `${GLib.get_user_config_dir()}/ags-nm-panel/style.css`
let toggle: (x?: number) => void

app.start({
  instanceName: "ags-nm-panel",
  css: style,
  gtkTheme: "Adwaita",
  main() {
    if (GLib.file_test(theme, GLib.FileTest.EXISTS)) app.apply_css(theme)
    const net = createNetwork()
    toggle = Panel(net)
    tray(net.state, toggle)
  },
  requestHandler(_, respond) {
    toggle()
    respond("ok")
  },
})
