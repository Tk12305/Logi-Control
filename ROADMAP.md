# Roadmap: 19 July–18 August 2026

This is a deliberately small, finishable plan. With limited Codex availability, each phase has a clear deliverable and a stopping point.

## Guiding rule

Keep the project a safe Electron interface around **Solaar** and **BlueZ**. Do not attempt to reverse-engineer Logitech Options+, write a device driver, or add a broad macro system before the basic release is dependable.

| Dates | Outcome | Work items | Done when |
| --- | --- | --- | --- |
| **19–24 July** | GitHub-ready v0.1 | Create repository; add this README, a licence, screenshots, issue templates, and a first release tag. | A new user can understand, install, launch, and report a problem without private guidance. |
| **25 July–17 August** | Reliable MX Master 3S release | Test Bolt connection, application launcher, DPI, wheel mode, SmartShift, and diagnostics after reboot. Fix only reproducible bugs. | The app works from the desktop launcher on the test laptop. |
| **18 August-1 September** | Add features | Add keyboard support if codex or i can get it done. |

## Priority order when time is tight

1. Fix crashes and broken installation.
2. Improve detection and clear error messages.
3. Test one additional device type.
4. Improve documentation and screenshots.
5. Only then add a new setting or user-interface feature.

## Explicitly out of scope before 18 August

- Full Logi Options+ / Logitech Flow parity
- Universal per-app profiles and macros
- A custom Bluetooth stack or Linux input driver
- Replacing Solaar's pairing or advanced-rule engine
- Claiming compatibility without a tested device or Solaar capability report

## Suggested GitHub milestones

- `v0.1.0 — MX Master 3S on Arch`
- `v0.2.0 — Generic device discovery`
- `v0.3.0 — Keyboard visibility`

## Test checklist for every release

- Launch from a terminal and desktop menu.
- Detect a Bolt receiver and connected device.
- Refresh diagnostics without errors.
- Change one safe setting and confirm it persists after reconnecting the device.
- Confirm that unsupported settings fail safely.
- Check the README from a clean machine/user perspective.
