# GitHub listing

## Repository name

`logi_control`

## Short description

An unofficial Electron control panel for Logitech mice and keyboards on Arch Linux, powered by Solaar and BlueZ, with device settings and Bluetooth management.

## Suggested topics

`arch-linux` · `logitech` · `solaar` · `electron` · `logi-bolt` · `mx-master` · `mx-keys` · `linux-desktop` · `bluetooth`

## About text for the first release

Logi Control is an independent Linux control panel for supported Logitech devices. It wraps Solaar with a device-first Electron interface for connection health, diagnostics, and safe hardware settings. Supports mice (DPI, SmartShift, scroll), keyboards (backlight, Fn-swap, OS layout), and BlueZ Bluetooth actions including scan, pair/trust, connect, disconnect, and forget.

## Suggested release title

`v0.3.0 — Mice and keyboards on Arch`

## Suggested release notes

- Generic device discovery for all Solaar-detected mice and keyboards.
- Device selector to switch between connected devices.
- Mouse controls: DPI, SmartShift, scroll-wheel mode, and scroll direction.
- Keyboard controls: backlight, Fn-swap, and OS layout (multiplatform).
- First-run setup guidance, remembered device selection, and safe automatic status refreshes.
- Bluetooth manager: scan, pair/trust, connect, disconnect, and forget with address validation and removal confirmation.
- Desktop launcher installer; no npm dependency required at runtime.
- Known limitation: advanced rule-based remapping has extra Wayland permission requirements and is not part of the default interface.
