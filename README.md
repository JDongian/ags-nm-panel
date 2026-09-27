# ags-nm-panel

A Wi-Fi panel for NetworkManager, made for Hyprland on NixOS. It opens from a
waybar button and replaces the nm-applet menu. Built with
[AGS](https://aylur.github.io/ags/).

![The panel: active connection on top, available networks below](screenshot.png)

## Why

I use Hyprland with waybar. I don't want to switch to a full desktop shell
to get a better network menu.

I like the network dropdown in [wayle](https://github.com/wayle-rs/wayle).
wayle is a whole shell, and I only wanted that one part.

The nm-applet menu is silly. You click a tray icon, open a submenu to see the
networks, and type the password into a separate dialog.

This panel is based on wayle's network dropdown and is much simpler. It uses
NetworkManager and the nm-applet tools wherever it can, which keeps it to
about 400 lines of code.

It uses your GTK font, so bitmap fonts work. The screenshot is gohufont.

## What it does

- Lists each network once, saved ones first, then by signal.
- Joins open and saved networks in one click, and asks for the password
  inline for new ones.
- Shows each connecting step, then the address and band once connected.
- Shows a failed attempt in a notice at the top, with the reason
  NetworkManager gave.
- Shows Disconnect, Cancel, or Forget when you hover a row.
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

Run `ags-nm-panel toggle` from a bar button. The panel opens under the cursor.

### Waybar

`waybar/network.sh` is a waybar module for the panel. It shows signal
strength, and a different icon for each of the three connecting stages. It
needs `nmcli`, `jq`, and a Nerd Font.

```jsonc
"custom/network": {
    "exec": "/path/to/waybar/network.sh",
    "return-type": "json",
    "restart-interval": 5,
    "on-click": "ags-nm-panel toggle"
}
```

## Passwords

The panel sends the password to NetworkManager over D-Bus. The password is
never passed on a command line or written to a log. NetworkManager stores it
in a system connection profile that only root can read. The panel does not
use a keyring or a secret agent.

## Theme

The colours are eight variables at the top of `src/style.scss`. The font
comes from your GTK settings.

## Credits

Based on the network dropdown in [wayle](https://github.com/wayle-rs/wayle)
by Jas Singh. The layout and some labels come from wayle. The code is new.
wayle is written in Rust and this is TypeScript.

This panel is much smaller than wayle's because it uses what is already
installed. NetworkManager creates the connection profiles and reports the
failure reasons. `nm-connection-editor` handles editing and enterprise login.
nm-applet provides the Connection Information window. The panel has no
settings, translations, or theme engine.

## License

Copyright (C) 2026 Joshua Dong. Released under the [WTFPL](LICENSE).

AGS is only needed to build the panel and is not installed with it. The
build includes AGS's JavaScript library in the program. That library is
GPL-3.0.
