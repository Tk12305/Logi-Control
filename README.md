# Logi Control

> An unofficial Electron control panel for Logitech devices on Arch Linux, powered by Solaar and BlueZ.

Logi Arch Control is a lightweight Linux alternative to the useful device-management parts of Logi Options+. It does **not** run, bundle, or modify Logitech Options+, which has no Linux release.

It currently provides a polished control panel for Logitech devices that Solaar recognises, including receiver/device discovery, diagnostics, supported hardware settings, Logi Bolt pairing through Solaar, and Bluetooth visibility through BlueZ.

## Current support

- **Best tested:** MX Master 3S connected through a Logi Bolt receiver.
- **Receiver families:** Logi Bolt and Unifying are the intended initial targets.
- **Settings:** Only settings reported by the connected device are changed. Examples include DPI, SmartShift, wheel mode, and wheel direction.
- **Linux desktop sessions:** Hardware settings work on X11 and Wayland. Advanced input remapping on Wayland needs additional desktop-specific permissions.

This is an independent community project. Logitech and Logi Options+ are trademarks of Logitech.

## Requirements

- Arch Linux or an Arch-based distribution
- A supported Logitech device and receiver, or a compatible Bluetooth device
- Internet access for the first package installation

## Install

### For Arch
[Arch-Install.md](Arch-Install.md)

The installer installs Electron, Solaar, BlueZ, and BlueZ utilities using `pacman`; enables Bluetooth; copies the app to `~/.local/share/logi-control`; and adds **Logi Control** to your desktop app launcher.

The installer asks for your password only when Arch needs permission to install packages or enable Bluetooth.

### Run without installing

```bash
sudo pacman -S --needed electron solaar bluez bluez-utils
sudo systemctl enable --now bluetooth.service
electron .
```

### Uninstall the app

From the project directory:

```bash
bash uninstall.sh
```

This removes the app and launcher only; it leaves Electron, Solaar, and Bluetooth packages installed.

## Getting started

1. Plug in a Logi Bolt receiver.
2. Start **Logi Control**.
3. Click **Refresh devices**.
4. Use the hardware controls that your device exposes.
5. Click **Open Solaar** for receiver pairing, advanced settings, and device-specific configuration.

For the MX Master 3S, the reliable Linux connection is the supplied Logi Bolt receiver. Bluetooth is optional and is managed by your normal desktop Bluetooth settings, not by Solaar.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Mouse is paired but does not move | Select the correct Easy-Switch channel on the underside of the mouse. |
| Bolt receiver is not detected | Replug it directly into the computer and click **Refresh devices**. |
| A setting does not appear | The connected device does not report that capability to Solaar. |
| Advanced button rules do not work on Wayland | Use Solaar's guidance for its required udev/desktop permissions, or use X11 for advanced rule-based remapping. |

## Scope and roadmap

See [ROADMAP.md](ROADMAP.md) for the plan through 18 August 2026. The initial release deliberately prioritises reliable device detection and safe hardware controls over large, fragile remapping features.

## Contributing

Before opening an issue, include:

```bash
solaar show
solaar config "YOUR DEVICE NAME"
```

Please redact serial numbers before posting output. Include your distribution, desktop session (Wayland or X11), connection type, and receiver USB ID when possible.
