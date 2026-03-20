# world

explore a minimal procedural world under an astronomically accurate night sky.

## stack

three.js, vite. all browser-based, no backend. star catalog and event data ship as static JSON. target: ~20 small source files across `sky/`, `world/`, `player/`, `time/`, and `ui/` directories.

## quick start

```bash
npm install
npm run dev
```

then open the local vite URL in your browser.

basic controls:

- `WASD` move
- `Space` jump
- right-click + drag look around
- use the bottom-right strip to pause, scrub by week / month / year, and change simulation speed
- click the bottom-left pin to enter a latitude, longitude, and date
- press `` ` `` to open debug tuning
- press `C` to toggle constellation lines
- press `H` or `9` to toggle the HUD
- press `O` to cycle spawn-mode override for testing (`auto`, `ocean`, `land`)

## status

early development. reconfiguring for use in personal website
