#!/usr/bin/env bash

signal=(󰤯 󰤟 󰤢 󰤥 󰤨)
wifi=$(nmcli -t -f DEVICE,TYPE dev | awk -F: '$2=="wifi"{print $1; exit}')
eth=$(nmcli -t -f DEVICE,TYPE dev | awk -F: '$2=="ethernet"{print $1; exit}')

state() { nmcli -g GENERAL.STATE dev show "$1" 2>/dev/null | cut -d' ' -f1; }

emit() {
  local text tip class=connecting sig ssid
  case $(state "$wifi") in
    40) text=󰑃 tip="Preparing" ;;
    50 | 60) text=󱗘 tip="Authenticating" ;;
    70 | 80 | 90) text=󰑄 tip="Obtaining IP address" ;;
    100)
      IFS=: read -r _ sig ssid < <(nmcli -t -f ACTIVE,SIGNAL,SSID dev wifi list --rescan no | grep '^yes')
      text=${signal[sig >= 100 ? 4 : sig / 20]} class=connected
      tip="$ssid"$'\n'"$wifi: $(nmcli -g IP4.ADDRESS dev show "$wifi")  $sig%"
      ;;
    *)
      if [ "$(state "$eth")" = 100 ]; then
        text=󰈀 class=connected tip="$eth: $(nmcli -g IP4.ADDRESS dev show "$eth")"
      else
        text=󰤮 class=disconnected tip="Disconnected"
      fi
      ;;
  esac
  jq -nc --arg text "$text" --arg tooltip "$tip" --arg class "$class" '$ARGS.named'
}

last=
nmcli monitor | while :; do
  now=$(emit)
  [ "$now" != "$last" ] && echo "$now" && last=$now
  read -t 5 -r _
  [ $? = 1 ] && exit
done
