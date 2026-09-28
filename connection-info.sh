#!/usr/bin/env bash

menu=/org/ayatana/NotificationItem/nm_applet/Menu

applet() {
  busctl --user call org.kde.StatusNotifierWatcher /StatusNotifierWatcher \
    org.freedesktop.DBus.Properties Get ss org.kde.StatusNotifierWatcher RegisteredStatusNotifierItems |
    grep -o ':[0-9.]*/org/ayatana/NotificationItem/nm_applet' | cut -d/ -f1
}

window() { hyprctl clients -j | jq -e 'any(.[]; .class == "nm-applet")' >/dev/null; }

if [ -z "$(applet)" ]; then
  nm-applet --indicator &
  trap 'kill $!' EXIT
fi

# nm-applet renumbers its menu while starting.
for _ in $(seq 50); do
  sleep 0.2
  dest=$(applet)
  id=$(busctl --user --json=short call "$dest" $menu com.canonical.dbusmenu GetLayout iias -- 0 -1 0 2>/dev/null |
    jq '[.. | arrays | select(length == 3 and .[1].label?.data == "Connection _Information")][0][0]')
  [ "${id:-null}" = null ] && continue
  busctl --user call "$dest" $menu com.canonical.dbusmenu Event isvu "$id" clicked s "" 0 2>/dev/null || continue
  sleep 0.5
  window && break
done

# A single hyprctl query can come back empty.
misses=0
while [ $misses -lt 3 ]; do
  sleep 1
  window && misses=0 || misses=$((misses + 1))
done
