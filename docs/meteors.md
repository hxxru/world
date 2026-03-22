# meteor shower implementation plan

## overview

add a meteor shower system. meteors are procedurally generated visual
events driven by a hardcoded table of annual shower parameters. the system also
produces sporadic (random background) meteors year-round.

## new files to create

- `src/sky/meteors.js` — shower data, spawn logic, rendering
- update `src/sky/coordinates.js` to expose solar longitude, then call the
  meteor system from `src/main.js`, which is where the current app owns the
  global update loop and observer state

## step 1: solar longitude

meteor shower activity is keyed to solar longitude (λ☉), not calendar date.
solar longitude is the ecliptic longitude of the sun as seen from earth.
you already compute the sun's position — extract its ecliptic
longitude and expose it as a function:

```javascript
// returns solar longitude in degrees [0, 360) for a given julian date
function solarLongitude(jd) { ... }
```

this is the single number that determines which showers are active and at what
intensity on any given date.

## step 2: shower data table

hardcode this table. each shower is an object with these fields:

```javascript
{
  name: string,           // display name
  code: string,           // IAU three-letter code
  peakLambda: number,     // solar longitude of peak activity (degrees)
  start: number,          // solar longitude of activity start
  end: number,            // solar longitude of activity end
  ra: number,             // radiant right ascension at peak (degrees)
  dec: number,            // radiant declination at peak (degrees)
  driftRA: number,        // radiant RA drift (degrees per degree of solar longitude)
  driftDec: number,       // radiant Dec drift (degrees per degree of solar longitude)
  zhr: number,            // zenithal hourly rate at peak
  r: number,              // population index (brightness distribution)
  v: number,              // entry velocity km/s (affects streak length + color)
}
```

### the shower table

use these 12 showers (all class I or strong class II from IMO data):

| name                  | code | peakLambda | start | end   | ra   | dec  | driftRA | driftDec | zhr | r   | v  |
|-----------------------|------|-----------|-------|-------|------|------|---------|----------|-----|-----|----|
| Quadrantids           | QUA  | 283.16    | 276.0 | 293.0 | 230  | +49  | 0.40    | -0.20    | 80  | 2.1 | 41 |
| Lyrids                | LYR  | 32.32     | 24.0  | 40.0  | 271  | +34  | 1.10    | 0.00     | 18  | 2.1 | 49 |
| eta Aquariids         | ETA  | 45.5      | 35.0  | 60.0  | 338  | -01  | 0.90    | +0.40    | 50  | 2.4 | 66 |
| S. delta Aquariids    | SDA  | 126.0     | 117.0 | 140.0 | 340  | -16  | 0.70    | +0.18    | 25  | 2.5 | 41 |
| alpha Capricornids    | CAP  | 127.0     | 112.0 | 140.0 | 307  | -10  | 0.90    | +0.26    | 5   | 2.3 | 23 |
| Perseids              | PER  | 140.0     | 120.0 | 160.0 | 48   | +58  | 1.40    | +0.12    | 100 | 2.2 | 59 |
| Orionids              | ORI  | 208.0     | 195.0 | 225.0 | 95   | +16  | 0.70    | +0.10    | 20  | 2.5 | 66 |
| S. Taurids            | STA  | 197.0     | 172.0 | 227.0 | 52   | +15  | 0.79    | +0.15    | 5   | 2.3 | 27 |
| N. Taurids            | NTA  | 230.0     | 207.0 | 252.0 | 58   | +22  | 0.76    | +0.10    | 5   | 2.3 | 29 |
| Leonids               | LEO  | 235.27    | 228.0 | 244.0 | 152  | +22  | 1.50    | -0.40    | 15  | 2.5 | 71 |
| Geminids              | GEM  | 262.2     | 250.0 | 270.0 | 112  | +33  | 1.02    | -0.07    | 150 | 2.6 | 35 |
| Ursids                | URS  | 270.7     | 264.0 | 279.0 | 217  | +75  | -0.20   | +0.10    | 10  | 3.0 | 32 |

note: the start/end values that wrap around 360/0 (none in this table, but watch
out if you add showers with start > end, e.g. a shower spanning the vernal equinox).

## step 3: activity calculation

for a given solar longitude λ, compute each shower's current ZHR:

```javascript
function showerActivity(shower, currentLambda) {
  // is shower active?
  let dLambda = currentLambda - shower.peakLambda;
  // normalize to [-180, 180]
  if (dLambda > 180) dLambda -= 360;
  if (dLambda < -180) dLambda += 360;

  const halfWidth = Math.max(
    shower.peakLambda - shower.start,
    shower.end - shower.peakLambda
  );
  if (Math.abs(dLambda) > halfWidth) return 0;

  // gaussian-ish activity profile centered on peak
  // use different widths for rise vs fall if desired, but gaussian is fine
  const sigma = halfWidth / 3; // peak ± 3σ ≈ full window
  const activity = shower.zhr * Math.exp(-0.5 * (dLambda / sigma) ** 2);
  return activity;
}
```

then compute the actual observed rate for the observer's location:

```javascript
function observedRate(shower, currentLambda, jd, lat, lon) {
  const zhr = showerActivity(shower, currentLambda);
  if (zhr <= 0) return 0;

  // compute current radiant position (apply drift from peak)
  const dLambda = currentLambda - shower.peakLambda;
  const radiantRA = (shower.ra + shower.driftRA * dLambda) * Math.PI / 180;
  const radiantDec = (shower.dec + shower.driftDec * dLambda) * Math.PI / 180;

  // get radiant altitude above observer's horizon
  const { alt } = equatorialToHorizontal(radiantRA, radiantDec, jd, lat, lon);

  if (alt <= 0) return 0; // radiant below horizon = no visible meteors

  // observed rate = ZHR × sin(radiant altitude)
  return zhr * Math.sin(alt);
}
```

## step 4: meteor spawning

use a poisson process. each frame, for each active shower + sporadics:

```javascript
// per frame, per shower:
const rate = observedRate(shower, lambda, jd, lat, lon); // meteors/hour
const expectedThisFrame = (rate / 3600) * dt; // dt in seconds
// poisson: probability of at least one meteor this frame
if (Math.random() < expectedThisFrame) {
  spawnMeteor(shower, ...);
}
```

this works because for small expectedThisFrame (which it will be — even at
ZHR 150 that's ~0.002 per frame at 60fps), `P(k≥1) ≈ λ` for a poisson process.

### sporadic meteors

add a constant background source with no specific radiant:

```javascript
const SPORADIC_RATE = 6; // per hour, typical dark sky
// spawn from random positions above the horizon
// random streak direction
// random magnitude weighted toward faint
```

## step 5: individual meteor generation

when spawning a meteor, generate these parameters:

**start position**: pick a random point near the radiant.
use a rayleigh distribution for angular offset from radiant center:

```javascript
const angularOffset = rayleigh(sigma=15) * (Math.PI / 180); // ~15° spread
const posAngle = Math.random() * 2 * Math.PI; // random position angle around radiant
```

offset the radiant RA/Dec by this amount to get the meteor's start point.

**streak direction**: radially away from radiant (this is the key visual signature
of a shower — all streaks point away from the radiant like spokes from a hub).

compute the unit vector from radiant → start position on the celestial sphere.
the streak extends further along this direction.

**streak length**: proportional to entry velocity and inversely to how close
the meteor is to the radiant (foreshortening effect — meteors near the radiant
appear shorter because they're coming toward you).

```javascript
const angularLength = (shower.v / 40) * 8 * (angularOffset / (15 * Math.PI / 180));
// clamp to [2°, 25°]
// units: degrees of arc
```

**magnitude**: random, drawn from the population index distribution.

```javascript
// population index r means N(m+1)/N(m) = r
// draw from exponential: brighter = rarer
const mag = -1 + (Math.log(Math.random()) / Math.log(1/shower.r)) * -1;
// clamp to [-3, 6.5] — fireballs to faint
```

brighter meteors should be visually thicker/brighter. the occasional mag < 0
fireball should have a brief bloom/flash.

**color**: derive from entry velocity.
- slow (< 30 km/s): yellow-white (geminids, capricornids)
- medium (30-50 km/s): white (quadrantids, lyrids)
- fast (> 50 km/s): green-white or blue-white tint (perseids, leonids, eta aquariids)

```javascript
function meteorColor(velocity, mag) {
  const base = velocity < 30 ? [1.0, 0.9, 0.7]
             : velocity < 50 ? [1.0, 1.0, 0.95]
             :                  [0.8, 1.0, 0.9];
  // brighter meteors are more saturated in color
  // faint ones tend white
  const saturation = Math.max(0, (3 - mag) / 6); // 0 at mag 3, 0.5 at mag 0
  return lerpColor([1,1,1], base, saturation);
}
```

**duration**: 0.1 to 1.5 seconds. brighter meteors persist longer.

```javascript
const duration = 0.15 + (6.5 - mag) * 0.15; // ~0.15s for faintest, ~1.1s for fireballs
```

## step 6: rendering

each active meteor is a short-lived line segment on the sky sphere.

**approach**: maintain a small pool of meteor objects (maybe 20 max — you'll
never have more than a few active simultaneously even in a storm).

each meteor has:
- start/end positions on the sky sphere (in alt/az, projected to world coords)
- birth time, duration
- magnitude → line width + opacity
- color

**animation**: the streak should appear to move — the head advances while the
tail follows. a simple approach:

```javascript
// t = 0 → 1 over the meteor's lifetime
// visible portion: head at lerp(start, end, t), tail at lerp(start, end, max(0, t - 0.3))
// so the streak appears, grows, moves, and fades
```

fade opacity: ramp up quickly (first 10% of duration), sustain, then fade out
(last 30%).

**geometry**: use `THREE.Line` or a thin billboard quad for each meteor.
for fireballs (mag < 0), add a brief additive bloom sprite at the head.

**important**: meteors are in alt/az space (they move with the sky), but they're
so brief that earth rotation during their lifetime is negligible. compute their
position once at spawn time.

## step 7: integration

in the main game loop:

```javascript
// in animate():
const lambda = solarLongitude(currentJD);
updateMeteors(meteorState, lambda, currentJD, observerLat, observerLon, dt, scene, camera);
```

the update function handles spawning new meteors, advancing active ones,
and removing expired ones.

## performance notes

- at most ~20 active meteor line objects at any time (even during a storm,
  you'd only see a few per second)
- the main cost is the poisson check per shower per frame (12 showers × 1
  random number = trivial)
- no physics, no collision — purely visual

## visual tuning parameters (expose as debug sliders)

- `sporadicRate`: background meteor rate (default 6/hr)
- `showerMultiplier`: global ZHR multiplier for testing (default 1.0, crank to
  10+ to preview storm conditions)
- `streakBrightness`: overall meteor brightness
- `minMagnitude`: faintest visible meteor magnitude
