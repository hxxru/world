# architecture

## file structure

```
witness/
├── docs/
│   ├── aesthetics.md
│   ├── architecture.md
│   ├── astronomy.md
│   └── devlog.md
├── public/
│   ├── data/
│   │   ├── bsc5.json              # star catalog (top ~2000 by vmag)
│   │   ├── stellarium-western.json# raw Stellarium western/index.json input
│   │   ├── constellations.json    # processed constellation lines (HIP ID pairs)
│   │   ├── star-names.json        # common star names keyed by HIP ID
│   │   └── land-mask.png          # equirectangular land/ocean mask
│   └── fonts/                     # UI fonts (Space Mono, Spectral or similar)
├── scripts/
│   └── preprocess-constellations.mjs  # flatten Stellarium polylines into segments
├── src/
│   ├── config/
│   │   ├── preferences.js         # persisted user settings / defaults
│   │   └── runtime-config.js      # shared tuning values used by runtime systems
│   ├── main.js                    # entry: init scene, game loop, orchestration
│   ├── sky/
│   │   ├── coordinates.js         # all astronomical coordinate math
│   │   ├── stars.js               # star field rendering (instanced mesh)
│   │   ├── constellations.js      # constellation line rendering
│   │   ├── meteors.js             # procedural meteor showers + sporadics
│   │   ├── planets.js             # astronomy-engine planet positions + rendering
│   │   ├── sun-moon.js            # astronomy-engine sun/moon positions + rendering
│   │   ├── atmosphere.js          # sky gradient shader
│   │   └── milkyway.js            # milky way band (post-MVP, stub for now)
│   ├── world/
│   │   ├── terrain.js             # procedural heightmap + mesh
│   │   ├── water.js               # water plane + ripple shader
│   │   ├── trees.js               # instanced pine trees
│   │   └── land-mask.js           # land/ocean lookup from texture
│   ├── player/
│   │   ├── camera.js              # profile-aware first-person controls (desktop + touch)
│   │   └── spawn.js               # spawn logic (land vs boat)
│   ├── time/
│   │   └── clock.js               # julian date clock, pause / reverse / speed presets
│   └── ui/
│       ├── celestial-symbols.js   # symbol mapping for HUD and labels
│       ├── hud.js                 # compact telemetry readout
│       ├── info-modal.js          # controls / onboarding modal
│       ├── labels.js              # desktop hover labels + touch crosshair labels
│       ├── modal.js               # reusable modal shell
│       ├── settings-modal.js      # settings surface for observer / display / speed
│       ├── time-controls.js       # play/pause + date-jump strip
│       ├── touch-controls.js      # left-move / right-look / jump mobile overlay
│       └── utility-buttons.js     # visible Settings / Info buttons
├── index.html
├── package.json
└── vite.config.js
```

## module responsibilities and boundaries

each module has a single responsibility. modules communicate through well-defined interfaces, not by reaching into each other's internals.

### `src/sky/coordinates.js`
**owns:** all astronomical math — coordinate transforms, sidereal time, precession, solar longitude, obliquity.
**exports:**
- `julianDate(year, month, day, hour)` → JD (number)
- `gregorianFromJD(jd)` → `{year, month, day, hour}`
- `greenwichMeanSiderealTime(jd)` → degrees
- `localSiderealTime(gmst, longitude)` → degrees
- `precessRADec(ra, dec, T)` → `{ra, dec}` (precessed to date T centuries from J2000)
- `equatorialToHorizontal(ra, dec, lst, latitude)` → `{alt, az}` (degrees)
- `horizontalToCartesian(alt, az, radius)` → `{x, y, z}` (three.js coords)
- `solarLongitude(jd)` → degrees
- `obliquityOfEcliptic(T)` → degrees
- `eclipticToEquatorial(lon, lat, obliquity)` → `{ra, dec}`

**does NOT own:** rendering, three.js objects, star data loading.

### `src/sky/stars.js`
**owns:** loading star catalog, creating instanced mesh, updating positions on the celestial sphere, star colors/sizes.
**exports:**
- `createStarField(scene, starData)` → star field object
- `updateStarPositions(starField, lst, latitude, T)` — recompute positions
- `updateStarVisibility(starField, sunAltitude)` — fade stars based on sky brightness
- `setStarFieldVisible(starField, visible)` — show/hide

**depends on:** `coordinates.js` for math, star data from `public/data/bsc5.json` (currently the brightest ~2000 HYG-derived stars).

### `src/sky/constellations.js`
**owns:** loading processed constellation data, creating line segments, updating positions, skipping missing HIP endpoints gracefully.
**exports:**
- `createConstellationLines(scene, constellationData, starData)` → constellation lines object
- `updateConstellationPositions(lines, lst, latitude, T)` — sync with star positions
- `toggleConstellationLines(lines)` — show/hide on keypress

**depends on:** `coordinates.js`, star position data (shares the same star catalog), processed data from `public/data/constellations.json`.
when a segment endpoint is missing from the filtered BSC subset, skip that segment and log the constellation as incomplete instead of failing the whole overlay.

### `src/sky/planets.js`
**owns:** planet position lookup via `astronomy-engine`, planet rendering, and permanent label placement.
**exports:**
- `createPlanets(scene)` → planets object
- `updatePlanetPositions(planets, jd, lst, latitude)` — recompute positions from `astronomy-engine`

**depends on:** `astronomy-engine` for topocentric equatorial coordinates, `coordinates.js` for equatorial→horizontal→cartesian transforms.

### `src/sky/meteors.js`
**owns:** annual shower tables, solar-longitude keyed activity curves, sporadic meteor spawning, and short-lived meteor rendering on the sky sphere.
**exports:**
- `createMeteorShowers(scene)` → meteor system object
- `updateMeteorShowers(system, state)` — update shower activity, spawn meteors, animate active streaks

**depends on:** `coordinates.js` for solar longitude and coordinate transforms, `attenuation.js` for night-sky visibility weighting, and runtime tuning/preferences for user-facing controls.

### `src/sky/sun-moon.js`
**owns:** sun/moon position lookup via `astronomy-engine`, moon phase shading, sun/moon rendering.
**exports:**
- `createSunMoon(scene)` → sun/moon object
- `updateSunMoon(sunMoon, jd, lst, latitude)` — recompute positions
- `getSunAltitude(sunMoon)` → degrees (used by atmosphere, star visibility, terrain lighting)
- `getMoonPhase(sunMoon)` → `{illuminatedFraction, phaseAngle}`

**depends on:** `astronomy-engine` for equatorial positions and illumination data, `coordinates.js` for equatorial→horizontal→cartesian transforms.

### `src/sky/atmosphere.js`
**owns:** sky gradient rendering.
**exports:**
- `createAtmosphere(scene)` → atmosphere object (large sphere or skybox with shader)
- `updateAtmosphere(atmosphere, sunAltitude, sunAzimuth)` — update gradient based on sun position

**depends on:** sun altitude from `sun-moon.js`.

### `src/world/terrain.js`
**owns:** procedural heightmap generation, terrain mesh.
**exports:**
- `createTerrain(scene, seed)` → terrain object
- `getHeightAt(terrain, x, z)` → y (height at world position, for ground collision)
- `regenerateTerrain(terrain, seed)` — rebuild with new seed (on teleport)
- `updateTerrainLighting(terrain, ambientLevel)` — modulate colors by light

**depends on:** simplex-noise library.

### `src/world/water.js`
**owns:** water plane rendering.
**exports:**
- `createWater(scene)` → water object
- `updateWater(water, time)` — animate ripple shader

### `src/world/trees.js`
**owns:** tree placement and instanced rendering.
**exports:**
- `createTrees(scene, terrain, seed)` → trees object
- `regenerateTrees(trees, terrain, seed)` — rebuild on teleport
- `updateTreesLighting(trees, ambientLevel)` — tint toward silhouettes at night

**depends on:** `terrain.js` for height sampling (trees sit on terrain surface).

### `src/world/land-mask.js`
**owns:** loading and sampling the land/ocean texture.
**exports:**
- `loadLandMask(url)` → land mask object
- `isLand(landMask, latitude, longitude)` → boolean

### `src/player/camera.js`
**owns:** first-person camera controls and normalized movement/look input state for both desktop and touch profiles.
**exports:**
- `createPlayerCamera(camera, domElement)` → player controller state
- `updatePlayer(player, terrain, deltaTime)` — movement, ground collision

**depends on:** `terrain.js` for `getHeightAt`.

### `src/player/spawn.js`
**owns:** spawn logic (land vs boat).
**exports:**
- `spawnPlayer(player, terrain, landMask, latitude, longitude)` — position player at coordinates

**depends on:** `land-mask.js`, `terrain.js`.

### `src/time/clock.js`
**owns:** game time state, pause / reverse / speed presets, julian date math.
**exports:**
- `createClock(initialJD)` → clock object
- `tickClock(clock, realDeltaSeconds)` — advance time
- `setClockSpeed(clock, multiplier)` — 1, 60, 360, 3600
- `setClockPaused(clock, paused)`
- `setClockJD(clock, jd)` — jump to specific date
- `getClockJD(clock)` → current JD
- `getClockT(clock)` → julian centuries from J2000

**depends on:** `coordinates.js` for JD conversion.

### `src/config/preferences.js`
**owns:** localStorage-backed preferences and startup defaults.
**current defaults include:** Korean sky culture, constellation lines enabled, HUD hidden, `360x` clock speed, persisted look sensitivities, and meteor visibility/tuning values.

### `src/ui/*`
**owns:** all DOM-based UI. HTML overlays, modal surfaces, touch controls, compact HUD, crosshair labels, and persistent settings controls.
`settings-modal.js` is now the main surface for observer changes, sky culture selection, and speed presets. `time-controls.js` is only the compact play/pause + date-jump strip. `labels.js` uses hover on desktop and a centered crosshair target on touch devices.
Meteor visibility and rate/brightness controls also live in Settings; there is no keyboard toggle for meteors.

## data flow

```
game loop (main.js):
│
├── clock.tick(dt)
│   └── updates JD, T
│
├── sun-moon.update(jd, lst, lat)
│   └── computes sun altitude → feeds atmosphere + star visibility
│
├── atmosphere.update(sunAlt)
│
├── stars.update(lst, lat, T)  [only on time change > threshold]
│   └── precession + coord transform for each star
│
├── constellations.update(lst, lat, T)  [synced with stars]
│
├── planets.update(jd, lst, lat)  [every frame — planets move fast enough]
│
├── meteors.update(jd, lst, lat, dt)
│   └── solar longitude + radiant altitude determine shower activity and spawn rate
│
├── terrain.updateLighting(ambientFromSun)
│
├── water.update(time)
│
├── player.update(dt)
│
└── ui.update(clock, player)
```

## interaction notes

- desktop keeps keyboard-first controls: `WASD`, `Space`, right-drag look, `H`, `C`, `P`, `M`, `O`, and speed presets on `1`-`4`
- touch uses coarse-pointer detection to switch to left-zone movement, right-zone look, a jump button, and center-screen crosshair label targeting
- the bottom-right time strip now handles play/pause and date jumps only; speed lives in settings and on numeric hotkeys
- observer location/date and sky culture are configured from settings, not a floating pin panel

## data formats

### `public/data/bsc5.json`
```json
[
  {
    "ra": 101.2872,      // right ascension, degrees, J2000
    "dec": -16.7161,     // declination, degrees, J2000
    "vmag": -1.46,       // visual magnitude
    "bv": 0.00,          // B-V color index
    "hip": 32349,        // hipparcos catalog number
    "name": "Sirius"     // common name (null if none)
  },
  ...
]
```

### `public/data/constellations.json`
```json
[
  {
    "name": "Orion",
    "abbr": "Ori",
    "lines": [
      [27366, 26311],    // pairs of hipparcos IDs forming line segments
      [26311, 25336],
      ...
    ]
  },
  ...
]
```

this is a processed runtime artifact generated from Stellarium's western sky-culture JSON. each `lines` entry is flattened to explicit segment pairs so rendering can feed directly into `THREE.LineSegments`.

### `public/data/stellarium-western.json`
```json
{
  "constellations": [
    {
      "iau": "Ori",
      "lines": [
        [27989, 26727, 26311],
        [26727, 27366]
      ]
    }
  ],
  "common_names": {
    "HIP 27989": {
      "english": "Betelgeuse"
    }
  }
}
```

the raw Stellarium format stores each constellation `lines` entry as a polyline chain. preprocessing expands `[a, b, c]` into `[[a, b], [b, c]]` and extracts star names from `common_names`.

### `public/data/star-names.json`
```json
{
  "27989": "Betelgeuse",
  "24436": "Rigel"
}
```

## dependencies

**runtime:**
- three.js — 3D rendering
- simplex-noise — terrain generation
- astronomy-engine — planet, sun, and moon ephemerides for the MVP
- (post-processing from three.js examples: EffectComposer, UnrealBloomPass, RenderPass)

**build:**
- vite — dev server + bundler

coordinate transforms and precession are implemented from scratch following `docs/astronomy.md`. `astronomy-engine` is the accepted MVP dependency for planet, sun, and moon positions; a future from-scratch replacement remains optional.

## conventions

- all angles in radians internally. convert to/from degrees only at I/O boundaries (user input, display output, catalog data loading).
- three.js coordinate system: Y-up, right-handed. x = east, z = south (or adjust — document the mapping in `coordinates.js` and keep it consistent).
- celestial sphere radius: 1000 units. all sky objects placed on this sphere.
- terrain world space: centered on player. terrain extends ~2000 units in each direction.
- naming: camelCase for functions and variables, PascalCase for classes (if any), kebab-case for filenames.
