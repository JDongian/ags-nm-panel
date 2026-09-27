# ags-nm-panel

A Wi-Fi panel for NetworkManager on Hyprland and NixOS. Click your bar, pick a network.
A small standalone replacement for the nm-applet menu, built with
[AGS](https://aylur.github.io/ags/).

![The panel: active connection on top, available networks below](screenshot.png)

## Why

I build my desktop out of separate parts: Hyprland, waybar, a launcher, a
notification daemon. I don't want a desktop shell that bundles all of them
and asks me to give up the bar I already have.

I like [wayle](https://github.com/wayle-rs/wayle), but only its network
dropdown. Getting that meant adopting the whole shell.

nm-applet's interface is silly: a tray icon, a menu, a submenu of networks,
and a separate dialog for the password. It works, and it looks like it came
from another desktop.

So this is a network panel on its own, opened from a waybar button. It is
inspired by wayle's, not a copy of it, and it is much simpler.

It is for you if:

- you run waybar and intend to keep it;
- you want one small program per job, not a shell;
- you care what font it uses. It takes whatever GTK is set to, so bitmap
  fonts work. The screenshot is gohufont.

It stays small on purpose. NetworkManager does the work and the panel shows
its state, in about 400 lines.

## What it does

- Lists each network once, saved ones first, then by signal.
- Joins open and saved networks in one click, and asks for the password
  inline for new ones.
- Shows what NetworkManager is doing: each connecting step, then the address
  and band once connected.
- Puts a failed attempt in a notice at the top, with NetworkManager's own
  reason, separate from your live connections.
- Offers Disconnect, Cancel, and Forget when you hover a row.
- Opens `nm-connection-editor` when you click an active connection, and
  nm-applet's Connection Information from the ⓘ button.
- Closes on Escape, a click outside, or a successful connection.

Hidden networks, VPN, and enterprise login are left to `nm-connection-editor`.

## Requirements

- NetworkManager
- Hyprland
- nm-applet installed, for `nm-connection-editor` and Connection
  Information. It does not need to be running.

## Install

### Nix

```nix
inputs.ags-nm-panel.url = "github:JDongian/ags-nm-panel";
```

Then add `inputs.ags-nm-panel.packages.${pkgs.system}.default` to your
packages.

### From source

You need AGS 3, Astal (`astal4`, `astal-io`), gjs, gtk4-layer-shell, libnm,
dart-sass, and jq.

```sh
ags bundle app.ts ags-nm-panel
install -Dm755 ags-nm-panel ~/.local/bin/ags-nm-panel
install -Dm755 connection-info.sh ~/.local/bin/ags-nm-panel-info
cp -r icons/hicolor ~/.local/share/icons/
```

## Use

Start it with your session. It stays hidden until toggled.

```
exec-once = ags-nm-panel
layerrule = no_anim on, match:namespace ags-nm-panel
```

`ags-nm-panel toggle` opens it under the cursor, so bind that to a bar button.

### Waybar

`waybar/network.sh` is a bar module to go with it. It shows signal strength,
and three icons while connecting: reaching out, negotiating, getting an
address. It needs `nmcli`, `jq`, and a Nerd Font.

```jsonc
"custom/network": {
    "exec": "/path/to/waybar/network.sh",
    "return-type": "json",
    "restart-interval": 5,
    "on-click": "ags-nm-panel toggle"
}
```

## Passwords

The panel hands the password to NetworkManager over D-Bus. It never appears
on a command line or in a log. NetworkManager stores it in a system
connection profile, which only root can read. There is no keyring and no
secret agent. The field is hidden while you type, with a toggle to reveal it.

## Theme

The eight colours are variables at the top of `src/style.scss`. The font is
whatever GTK is set to.

## Credits

Inspired by the network dropdown in
[wayle](https://github.com/wayle-rs/wayle) by Jas Singh. The layout and some
of the wording follow it. None of the code does: wayle is Rust, this is
TypeScript, written from scratch.

It is also much smaller, because it does not reinvent what is already
installed. NetworkManager fills in new connection profiles and reports its
own failure reasons, where wayle builds and translates them itself. Editing a
connection, enterprise login, and Connection Information are handed to
`nm-connection-editor` and nm-applet. There are no settings, no translations,
and no theme engine.

## License

Copyright (C) 2026 Joshua Dong. Released under the [WTFPL](LICENSE).

AGS is a build tool here and is not installed with the panel. The build
compiles AGS's small JavaScript library into the program, and that library is
GPL-3.0.
