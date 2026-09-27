# ags-nm-panel

A standalone NetworkManager panel built with [AGS](https://aylur.github.io/ags/).
Click a button on your bar, get a Wi-Fi panel under it.

Most AGS network widgets live inside someone's full desktop shell. This one is
a single small program you can bolt onto waybar or any other bar.

```
┌──────────────────────────────────────┐
│ Network                       ⟳  (●) │
│ Active Connection                    │
│ ┌──────────────────────────────────┐ │
│ │ Home                   Connected │ │
│ │ 192.168.0.12 - 5 GHz             │ │
│ └──────────────────────────────────┘ │
│ Available Networks                   │
│ ┌──────────────────────────────────┐ │
│ │ Office                     Saved │ │
│ │ WPA2                             │ │
│ ├──────────────────────────────────┤ │
│ │ Cafe                           🔒 │ │
│ │ WPA2                             │ │
│ ├──────────────────────────────────┤ │
│ │ Airport                          │ │
│ │ Open                             │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Features

- One row per network, strongest signal first.
- Active wired and Wi-Fi connections with IP address and band or link speed.
- One click to join open and saved networks.
- Inline password entry for new networks.
- Live connection steps, and NetworkManager's own reason when one fails.
- Disconnect and Forget appear on hover.
- Wi-Fi switch and rescan in the header; rescans every time it opens.
- Closes on Escape, on a click outside, and after a successful connection.
- Enterprise (802.1X) networks open `nm-connection-editor`.

## Requirements

- NetworkManager
- Hyprland (the panel asks `hyprctl` where the cursor is, to open under it)
- `nm-connection-editor`, only for enterprise networks

## Install

With Nix flakes:

```nix
inputs.ags-nm-panel.url = "github:JDongian/ags-nm-panel";

# then, in home-manager or your system packages:
inputs.ags-nm-panel.packages.${pkgs.system}.default
```

Or try it without installing:

```sh
nix run github:JDongian/ags-nm-panel &
nix run github:JDongian/ags-nm-panel -- toggle
```

## Usage

Start it once with your session. It stays hidden until toggled.

```sh
ags-nm-panel &        # start
ags-nm-panel toggle   # show or hide
```

Hyprland:

```
exec-once = ags-nm-panel
```

Waybar:

```jsonc
"network": {
    "format-wifi": "{icon}",
    "format-ethernet": "󰈀",
    "format-disconnected": "󰤮",
    "format-icons": ["󰤯", "󰤟", "󰤢", "󰤥", "󰤨"],
    "tooltip-format": "{essid}\n{ifname}: {ipaddr}  {signalStrength}%",
    "on-click": "ags-nm-panel toggle"
}
```

## Theming

Colours are the eight variables at the top of `src/style.scss`. Change them
and rebuild.

## Development

```sh
nix develop
ags run app.ts
```

| File | Role |
|---|---|
| `src/model.ts` | State types and pure helpers |
| `src/network.ts` | NetworkManager state and actions |
| `src/Panel.tsx` | Window layout |
| `src/Row.tsx` | Row with hover actions |
| `src/style.scss` | Colours and spacing |

The design rule is that NetworkManager does the work and the panel shows its
state. If NetworkManager already handles something, the panel does not.

## Not supported

Hidden networks, VPN, captive portal login, hotspots, editing IP or DNS
settings, and inline enterprise login. Use `nm-connection-editor` for those.

## Credits

The layout and wording follow the network dropdown in
[wayle](https://github.com/wayle-rs/wayle) by Jas Singh.

## License

[WTFPL](LICENSE). The built program bundles the AGS runtime, which is
GPL-3.0.
