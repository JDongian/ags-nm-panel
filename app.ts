import app from "ags/gtk4/app"
import style from "./src/style.scss"
import Panel from "./src/Panel"
import { createNetwork } from "./src/network"
import tray from "./src/tray"

let toggle: (x?: number) => void

app.start({
  instanceName: "ags-nm-panel",
  css: style,
  gtkTheme: "Adwaita",
  main() {
    const net = createNetwork()
    toggle = Panel(net)
    tray(net.state, toggle)
  },
  requestHandler(_, respond) {
    toggle()
    respond("ok")
  },
})
