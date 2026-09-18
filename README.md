# Logi Control

> An unofficial Electron control panel for Logitech devices on Arch Linux, powered by Solaar and BlueZ.

Logi Control is a lightweight Linux alternative to the useful device-management parts of Logi Options+. It does **not** run, bundle, or modify Logitech Options+, which has no Linux release.

It provides a device-first control panel for Logitech devices that Solaar recognises, including receiver/device discovery, connection health, supported hardware settings, Logi Bolt pairing through Solaar, and Bluetooth management through BlueZ.

## Current support

- **Best tested:** MX Master 3S (mouse) and MX Keys / MX Keys Mini (keyboard) connected through a Logi Bolt receiver or Bluetooth.
- **Receiver families:** Logi Bolt and Unifying are the intended initial targets.
- **Mouse settings:** DPI, SmartShift, wheel mode, and scroll direction — only when reported by the device.
- **Keyboard settings:** Backlight, Fn-swap, and OS layout (multiplatform) — only when reported by the device.
- **Device discovery:** All Solaar-detected mice and keyboards appear in the device selector; controls adapt to the selected device.
- **Connection health:** Friendly first-run guidance highlights a missing Solaar service, unavailable Bluetooth service, or no detected compatible device.
- **Bluetooth controls:** Scan for nearby devices, pair and trust, connect, disconnect, and forget a Bluetooth pairing from the app. Bluetooth actions validate the device address and confirm before a pairing is removed.
- **Convenience:** The last selected device is remembered. Device status refreshes when the window regains focus and periodically while the app is open, without interrupting a setting change.
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

1. Plug in a Logi Bolt/Unifying receiver, or put a supported Bluetooth device into pairing mode.
2. Start **Logi Control**. The first-run guide checks that Solaar and Bluetooth support are available.
3. If needed, copy and run the install command shown in the guide, then click **Refresh devices**.
4. For Bluetooth, use **Scan nearby**, enter the shown device address, then choose **Pair & trust**.
5. Select your mouse or keyboard from the device menu and use the hardware controls it exposes.
6. Click **Open Solaar** for receiver pairing, advanced settings, and device-specific configuration.

For the MX Master 3S, the supplied Logi Bolt receiver is generally the most reliable Linux connection. Bluetooth pairing and connection are managed through BlueZ (`bluetoothctl`) in the app; device hardware settings are still provided by Solaar when the connected device reports them.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Mouse is paired but does not move | Select the correct Easy-Switch channel on the underside of the mouse. |
| Bolt receiver is not detected | Replug it directly into the computer and click **Refresh devices**. |
| A setting does not appear | The connected device does not report that capability to Solaar. |
| Fn-swap toggle has no effect | Some keyboards require **Fn+Esc** on the physical keyboard; this is a known Solaar/device limitation. |
| Bluetooth scan or pairing fails | Confirm that `bluetooth.service` is running, put the device into pairing mode, then scan again. Enter the displayed address in the form `AA:BB:CC:DD:EE:FF`. |
| Forget removed the wrong device | Bluetooth removal is confirmed before it runs. Pair the device again using **Scan nearby** and **Pair & trust**. |
| Advanced button rules do not work on Wayland | Use Solaar's guidance for its required udev/desktop permissions, or use X11 for advanced rule-based remapping. |

## Scope and roadmap

See [ROADMAP.md](ROADMAP.md) for the plan. The project prioritises reliable device detection and safe hardware controls over large, fragile remapping features.

## Contributing

Before opening an issue, include:

```bash
solaar show
solaar config "YOUR DEVICE NAME"
```

Please redact serial numbers before posting output. Include your distribution, desktop session (Wayland or X11), connection type, and receiver USB ID when possible.
