import app from "ags/gtk4/app"
import style from "./src/style.scss"
import Panel from "./src/Panel"
import { createNetwork } from "./src/network"

app.start({
  instanceName: "ags-nm-panel",
  css: style,
  gtkTheme: "Adwaita",
  main() {
    Panel(createNetwork())
  },
  requestHandler(_, respond) {
    app.toggle_window("network")
    respond("ok")
  },
})
