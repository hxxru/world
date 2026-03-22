# world

explore a minimal procedural world under an astronomically accurate night sky.
object interaction to be added

## stack

three.js, vite. all browser-based, no backend. star catalog and event data ship as static JSON. target: ~20 small source files across `sky/`, `world/`, `player/`, `time/`, and `ui/` directories.

## quick start

```bash
npm install
npm run dev
```

then open the local vite URL in your browser.

basic controls:

desktop:

- `WASD` move
- `Space` jump
- right-click + drag look around
- use the bottom-right strip to play/pause and jump by week / month / year
- press `1` / `2` / `3` / `4` for `1x` / `60x` / `360x` / `3600x`
- press `` ` `` to open settings
- press `I` to open info / how to play
- press `C` to toggle constellation lines
- press `H` to toggle the HUD
- press `P` to play / pause time
- press `M` to toggle the Polaris marker
- press `O` to cycle spawn-mode override for testing (`auto`, `ocean`, `land`)

mobile:

- use the left touch zone to move
- use the right touch zone to look around
- use the jump button near the bottom-right
- use the centered crosshair to inspect sky labels
- open settings to change latitude, longitude, date, sky culture, and speed

defaults:

- startup JD: `2451545.18785`
- default sky culture: `Korean`
- constellation lines on
- HUD off
- clock speed `360x`

## status

active prototype. current focus is interaction polish, mobile support, and documentation cleanup.
