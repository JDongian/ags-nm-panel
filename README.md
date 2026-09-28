# ags-nm-panel

A Wi-Fi panel for NetworkManager on Hyprland. It opens from a tray icon and
replaces the nm-applet menu. Built with
[AGS](https://aylur.github.io/ags/) and packaged for NixOS.

![Screenshot of the panel](screenshot.png)

## Why

I use Hyprland with waybar and didn't want to switch to a full desktop shell.

I like the network dropdown in [wayle](https://github.com/wayle-rs/wayle),
but wayle is a whole shell and I only wanted that part.

With nm-applet you click a tray icon, open a submenu to see the networks, and
type the password into a separate dialog. I wanted all of that in one panel.

I wanted something simple. The panel is about 400 lines of code and uses
NetworkManager and the nm-applet tools for most of the work.

It uses your GTK font, so bitmap fonts work. The screenshot uses gohufont.

## What it does

- Adds a tray icon that shows signal strength and connection progress.
  Click it to open the panel.
- Lists networks, saved ones first, then by signal strength.
- Click a network to connect. New networks ask for a password in the panel.
- Shows connection progress, then the IP address and band.
- Shows connection errors at the top of the panel.
- Hover a row for Disconnect, Cancel, or Forget.
- Click the active connection to edit it in `nm-connection-editor`.
- The ⓘ button opens nm-applet's Connection Information window.
- Closes on Escape, on a click outside, or after connecting.

For hidden networks, VPN, and enterprise login, use `nm-connection-editor`.

## Requirements

- NetworkManager
- Hyprland
- A bar with a system tray, such as waybar's `tray` module
- nm-applet, installed. It doesn't need to be running. The Nix package
  includes it.

## Install

### Nix

```nix
inputs.ags-nm-panel.url = "github:JDongian/ags-nm-panel";
```

Then add
`inputs.ags-nm-panel.packages.${pkgs.stdenv.hostPlatform.system}.default` to
your packages. The flake builds for `x86_64-linux`.

### From source

You need AGS 3, Astal (`astal4`, `astal-io`), gjs, gtk4-layer-shell, libnm,
dart-sass, jq, and systemd's `busctl`. `~/.local/bin` must be on your `PATH`.

```sh
ags bundle app.ts ags-nm-panel
install -Dm755 ags-nm-panel ~/.local/bin/ags-nm-panel
install -Dm755 connection-info.sh ~/.local/bin/ags-nm-panel-info
mkdir -p ~/.local/share/icons
cp -r icons/hicolor ~/.local/share/icons/
```

## Use

Start it with Hyprland:

```
exec-once = ags-nm-panel
layerrule = no_anim on, match:namespace ags-nm-panel
```

The icon appears in your tray. `ags-nm-panel toggle` also opens the panel,
for a keybind.

## Passwords

The password is sent to NetworkManager over D-Bus and stored in a system
connection profile that only root can read. It is never passed on a command
line or logged. The panel doesn't use a keyring or a secret agent.

## Theme

Colours are variables at the top of `src/style.scss`. The font comes from
your GTK settings.

## Credits

Inspired by the network dropdown in [wayle](https://github.com/wayle-rs/wayle)
by Jas Singh. The layout and some labels come from wayle. The code is new.

## License

Copyright (C) 2026 Joshua Dong. Released under the [WTFPL](LICENSE).

AGS is only needed to build the panel. The build includes AGS's JavaScript
library, which is GPL-3.0.
