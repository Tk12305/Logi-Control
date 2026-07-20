#!/usr/bin/env bash
set -euo pipefail

app_name='logi-arch-control'
app_dir="$HOME/.local/share/$app_name"
desktop_dir="$HOME/.local/share/applications"

if ! command -v pacman >/dev/null; then
  echo 'This installer is for Arch Linux and Arch-based distributions.' >&2
  exit 1
fi

echo 'Installing Electron, Solaar, and Bluetooth support…'
sudo pacman -S --needed electron solaar bluez bluez-utils
sudo systemctl enable --now bluetooth.service

mkdir -p "$app_dir" "$desktop_dir"
tar --exclude='./node_modules' --exclude='./.git' --exclude='./*.zip' -cf - . | tar -C "$app_dir" -xf -

cat > "$desktop_dir/$app_name.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=Logi Control
Comment=Logitech Bolt and MX Master controls for Arch Linux
Exec=electron $app_dir
Icon=input-mouse
Terminal=false
Categories=Settings;HardwareSettings;
EOF

echo
echo 'Installed Logi Control.'
echo 'Find it in your app launcher, or run: electron ~/.local/share/logi-arch-control'
