import * as THREE from 'three';

import { tuning } from '../config/runtime-config.js';
import { computeAttenuation } from './attenuation.js';
import {
  equatorialToHorizontal,
  horizontalToCartesian,
  normalizeDegrees,
  solarLongitude,
} from './coordinates.js';

const SKY_RADIUS = 975;
const MAX_SPAWNS_PER_FRAME = 4;
const SHOWER_OFFSET_SIGMA = 15;
const HEAD_TEXTURE_SIZE = 64;
const RADIANT_MARKER_SIZE = 44;

const METEOR_SHOWERS = [
  { name: 'Quadrantids', code: 'QUA', peakLambda: 283.16, start: 276.0, end: 293.0, ra: 230, dec: 49, driftRA: 0.4, driftDec: -0.2, zhr: 80, r: 2.1, v: 41 },
  { name: 'Lyrids', code: 'LYR', peakLambda: 32.32, start: 24.0, end: 40.0, ra: 271, dec: 34, driftRA: 1.1, driftDec: 0.0, zhr: 18, r: 2.1, v: 49 },
  { name: 'eta Aquariids', code: 'ETA', peakLambda: 45.5, start: 35.0, end: 60.0, ra: 338, dec: -1, driftRA: 0.9, driftDec: 0.4, zhr: 50, r: 2.4, v: 66 },
  { name: 'S. delta Aquariids', code: 'SDA', peakLambda: 126.0, start: 117.0, end: 140.0, ra: 340, dec: -16, driftRA: 0.7, driftDec: 0.18, zhr: 25, r: 2.5, v: 41 },
  { name: 'alpha Capricornids', code: 'CAP', peakLambda: 127.0, start: 112.0, end: 140.0, ra: 307, dec: -10, driftRA: 0.9, driftDec: 0.26, zhr: 5, r: 2.3, v: 23 },
  { name: 'Perseids', code: 'PER', peakLambda: 140.0, start: 120.0, end: 160.0, ra: 48, dec: 58, driftRA: 1.4, driftDec: 0.12, zhr: 100, r: 2.2, v: 59 },
  { name: 'Orionids', code: 'ORI', peakLambda: 208.0, start: 195.0, end: 225.0, ra: 95, dec: 16, driftRA: 0.7, driftDec: 0.1, zhr: 20, r: 2.5, v: 66 },
  { name: 'S. Taurids', code: 'STA', peakLambda: 197.0, start: 172.0, end: 227.0, ra: 52, dec: 15, driftRA: 0.79, driftDec: 0.15, zhr: 5, r: 2.3, v: 27 },
  { name: 'N. Taurids', code: 'NTA', peakLambda: 230.0, start: 207.0, end: 252.0, ra: 58, dec: 22, driftRA: 0.76, driftDec: 0.1, zhr: 5, r: 2.3, v: 29 },
  { name: 'Leonids', code: 'LEO', peakLambda: 235.27, start: 228.0, end: 244.0, ra: 152, dec: 22, driftRA: 1.5, driftDec: -0.4, zhr: 15, r: 2.5, v: 71 },
  { name: 'Geminids', code: 'GEM', peakLambda: 262.2, start: 250.0, end: 270.0, ra: 112, dec: 33, driftRA: 1.02, driftDec: -0.07, zhr: 150, r: 2.6, v: 35 },
  { name: 'Ursids', code: 'URS', peakLambda: 270.7, start: 264.0, end: 279.0, ra: 217, dec: 75, driftRA: -0.2, driftDec: 0.1, zhr: 10, r: 3.0, v: 32 },
];

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function createHeadTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = HEAD_TEXTURE_SIZE;
  canvas.height = HEAD_TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    HEAD_TEXTURE_SIZE * 0.5,
    HEAD_TEXTURE_SIZE * 0.5,
    0,
    HEAD_TEXTURE_SIZE * 0.5,
    HEAD_TEXTURE_SIZE * 0.5,
    HEAD_TEXTURE_SIZE * 0.5
  );
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.82)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.16)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, HEAD_TEXTURE_SIZE, HEAD_TEXTURE_SIZE);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createRadiantMarkerTexture() {
  const size = 96;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  const center = size * 0.5;

  context.strokeStyle = 'rgba(255, 234, 190, 0.95)';
  context.lineWidth = 5;
  context.beginPath();
  context.arc(center, center, 22, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = 'rgba(255, 250, 224, 0.96)';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(center - 34, center);
  context.lineTo(center - 10, center);
  context.moveTo(center + 10, center);
  context.lineTo(center + 34, center);
  context.moveTo(center, center - 34);
  context.lineTo(center, center - 10);
  context.moveTo(center, center + 10);
  context.lineTo(center, center + 34);
  context.stroke();

  const glow = context.createRadialGradient(center, center, 12, center, center, 42);
  glow.addColorStop(0, 'rgba(255, 245, 210, 0.24)');
  glow.addColorStop(0.6, 'rgba(255, 236, 186, 0.12)');
  glow.addColorStop(1, 'rgba(255, 236, 186, 0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function lambdaDistance(from, to) {
  let delta = normalizeDegrees(from - to);
  if (delta > 180) {
    delta -= 360;
  }
  return delta;
}

function activityHalfWidth(shower) {
  const rise = normalizeDegrees(shower.peakLambda - shower.start);
  const fall = normalizeDegrees(shower.end - shower.peakLambda);
  return Math.max(rise, fall);
}

function showerActivity(shower, currentLambda) {
  const delta = lambdaDistance(currentLambda, shower.peakLambda);
  const halfWidth = activityHalfWidth(shower);

  if (Math.abs(delta) > halfWidth) {
    return 0;
  }

  const sigma = Math.max(halfWidth / 3, 1e-3);
  return shower.zhr * Math.exp(-0.5 * (delta / sigma) ** 2);
}

function altAzToDirection(alt, az) {
  const cartesian = horizontalToCartesian(alt, az, 1);
  return new THREE.Vector3(cartesian.x, cartesian.y, cartesian.z).normalize();
}

function interpolateOnSphere(start, end, t, target) {
  target.copy(start).multiplyScalar(1 - t).addScaledVector(end, t).normalize();
  return target;
}

function buildTangentBasis(direction) {
  const reference = Math.abs(direction.y) < 0.9
    ? new THREE.Vector3(0, 1, 0)
    : new THREE.Vector3(1, 0, 0);
  const tangentX = new THREE.Vector3().crossVectors(reference, direction).normalize();
  const tangentY = new THREE.Vector3().crossVectors(direction, tangentX).normalize();
  return { tangentX, tangentY };
}

function offsetDirectionFromRadiant(radiantDirection, offsetDeg, positionAngleRad) {
  const offsetRad = THREE.MathUtils.degToRad(offsetDeg);
  const { tangentX, tangentY } = buildTangentBasis(radiantDirection);
  const offsetAxis = tangentX.multiplyScalar(Math.cos(positionAngleRad)).addScaledVector(
    tangentY,
    Math.sin(positionAngleRad)
  );

  return new THREE.Vector3()
    .copy(radiantDirection)
    .multiplyScalar(Math.cos(offsetRad))
    .addScaledVector(offsetAxis, Math.sin(offsetRad))
    .normalize();
}

function tangentAwayFromRadiant(radiantDirection, startDirection) {
  const towardRadiant = new THREE.Vector3()
    .copy(radiantDirection)
    .addScaledVector(startDirection, -radiantDirection.dot(startDirection))
    .normalize();

  return towardRadiant.multiplyScalar(-1);
}

function directionToHorizontal(direction) {
  const altitude = THREE.MathUtils.radToDeg(Math.asin(clamp(direction.y, -1, 1)));
  const azimuth = normalizeDegrees(THREE.MathUtils.radToDeg(Math.atan2(direction.z, direction.x)));
  return { alt: altitude, az: azimuth };
}

function sampleRayleigh(sigma) {
  const sample = Math.max(1 - Math.random(), 1e-6);
  return sigma * Math.sqrt(-2 * Math.log(sample));
}

function poissonCount(lambda) {
  if (lambda <= 0) {
    return 0;
  }

  if (lambda > 1.5) {
    return Math.min(Math.floor(lambda), MAX_SPAWNS_PER_FRAME);
  }

  const threshold = Math.exp(-lambda);
  let product = 1;
  let count = 0;

  do {
    count += 1;
    product *= Math.random();
  } while (product > threshold);

  return Math.min(count - 1, MAX_SPAWNS_PER_FRAME);
}

function meteorColor(velocity, magnitude) {
  const base = velocity < 30
    ? new THREE.Color(1.0, 0.9, 0.7)
    : velocity < 50
      ? new THREE.Color(1.0, 1.0, 0.95)
      : new THREE.Color(0.8, 1.0, 0.9);
  const saturation = clamp((3 - magnitude) / 6, 0, 0.7);
  return new THREE.Color(1, 1, 1).lerp(base, saturation);
}

function sampleMeteorMagnitude(populationIndex) {
  const base = 1.5 + (Math.log(Math.max(Math.random(), 1e-6)) / Math.log(1 / populationIndex));
  const fireballBoost = Math.random() < 0.035 ? THREE.MathUtils.randFloat(1.4, 4.2) : 0;
  return clamp(base - fireballBoost, -3, 6.5);
}

function currentRadiant(shower, currentLambda, lst, latitude) {
  const delta = lambdaDistance(currentLambda, shower.peakLambda);
  const ra = normalizeDegrees(shower.ra + shower.driftRA * delta);
  const dec = clamp(shower.dec + shower.driftDec * delta, -89.9, 89.9);
  const horizontal = equatorialToHorizontal(ra, dec, lst, latitude);

  return {
    ra,
    dec,
    horizontal,
    direction: altAzToDirection(horizontal.alt, horizontal.az),
  };
}

function createMeteorInstance(headTexture) {
  const positions = new Float32Array(6);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });

  const line = new THREE.Line(geometry, material);
  line.visible = false;
  line.frustumCulled = false;

  const headMaterial = new THREE.SpriteMaterial({
    map: headTexture,
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  });
  const head = new THREE.Sprite(headMaterial);
  head.visible = false;
  head.scale.setScalar(0);
  head.frustumCulled = false;

  return {
    line,
    head,
    positions,
    startDirection: new THREE.Vector3(),
    endDirection: new THREE.Vector3(),
    headDirection: new THREE.Vector3(),
    tailDirection: new THREE.Vector3(),
    active: false,
    birthTime: 0,
    duration: 0,
    baseOpacity: 0,
    headScale: 0,
    sourceName: '',
  };
}

function deactivateMeteor(meteor) {
  meteor.active = false;
  meteor.line.visible = false;
  meteor.head.visible = false;
}

function activateMeteor(meteor, sourceName, color, magnitude, duration, birthTime, startDirection, endDirection, opacity) {
  meteor.active = true;
  meteor.sourceName = sourceName;
  meteor.birthTime = birthTime;
  meteor.duration = duration;
  meteor.baseOpacity = opacity;
  meteor.headScale = THREE.MathUtils.lerp(10, 30, clamp((2 - magnitude) / 6, 0.08, 1));
  meteor.startDirection.copy(startDirection);
  meteor.endDirection.copy(endDirection);
  meteor.line.material.color.copy(color);
  meteor.head.material.color.copy(color);
  meteor.line.visible = true;
  meteor.head.visible = true;
}

function meteorOpacityAt(progress) {
  if (progress <= 0.1) {
    return progress / 0.1;
  }

  if (progress >= 0.72) {
    return Math.max(0, 1 - (progress - 0.72) / 0.28);
  }

  return 1;
}

function drawMeteor(meteor, observerPosition, timeSeconds) {
  const elapsed = timeSeconds - meteor.birthTime;
  const progress = meteor.duration <= 0 ? 1 : elapsed / meteor.duration;

  if (progress >= 1) {
    deactivateMeteor(meteor);
    return;
  }

  const headT = clamp(progress, 0, 1);
  const tailT = clamp(progress - 0.28, 0, 1);
  interpolateOnSphere(meteor.startDirection, meteor.endDirection, headT, meteor.headDirection);
  interpolateOnSphere(meteor.startDirection, meteor.endDirection, tailT, meteor.tailDirection);

  meteor.positions[0] = meteor.tailDirection.x * SKY_RADIUS + observerPosition.x;
  meteor.positions[1] = meteor.tailDirection.y * SKY_RADIUS + observerPosition.y;
  meteor.positions[2] = meteor.tailDirection.z * SKY_RADIUS + observerPosition.z;
  meteor.positions[3] = meteor.headDirection.x * SKY_RADIUS + observerPosition.x;
  meteor.positions[4] = meteor.headDirection.y * SKY_RADIUS + observerPosition.y;
  meteor.positions[5] = meteor.headDirection.z * SKY_RADIUS + observerPosition.z;
  meteor.line.geometry.attributes.position.needsUpdate = true;
  meteor.line.geometry.computeBoundingSphere();

  const opacity = meteor.baseOpacity * meteorOpacityAt(progress);
  meteor.line.material.opacity = opacity;
  meteor.head.material.opacity = opacity * 1.2;
  meteor.head.position.set(meteor.positions[3], meteor.positions[4], meteor.positions[5]);
  meteor.head.scale.setScalar(meteor.headScale * clamp(opacity + 0.05, 0.1, 1.5));
}

function spawnFromRadiant(system, shower, currentLambda, lst, latitude, sunAltitude, birthTime) {
  const activity = showerActivity(shower, currentLambda);

  if (activity <= 0) {
    return false;
  }

  const radiant = currentRadiant(shower, currentLambda, lst, latitude);
  const radiantAlt = radiant.horizontal.alt;

  if (radiantAlt <= 0) {
    return false;
  }

  const visibility = computeAttenuation(radiantAlt, sunAltitude, 'stars').brightness;

  if (visibility <= 0.02) {
    return false;
  }

  const magnitude = sampleMeteorMagnitude(shower.r);

  if (magnitude > tuning.meteors.minMagnitude) {
    return false;
  }

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const offsetDeg = clamp(sampleRayleigh(SHOWER_OFFSET_SIGMA), 4, 48);
    const startDirection = offsetDirectionFromRadiant(radiant.direction, offsetDeg, Math.random() * Math.PI * 2);
    const tangent = tangentAwayFromRadiant(radiant.direction, startDirection);
    const angularLengthDeg = clamp((shower.v / 40) * 8 * (offsetDeg / 15), 2, 25);
    const endDirection = new THREE.Vector3()
      .copy(startDirection)
      .multiplyScalar(Math.cos(THREE.MathUtils.degToRad(angularLengthDeg)))
      .addScaledVector(tangent, Math.sin(THREE.MathUtils.degToRad(angularLengthDeg)))
      .normalize();

    const startHorizontal = directionToHorizontal(startDirection);
    const endHorizontal = directionToHorizontal(endDirection);
    const startVisibility = computeAttenuation(startHorizontal.alt, sunAltitude, 'stars').brightness;

    if (startHorizontal.alt <= 3 || endHorizontal.alt <= -4 || startVisibility <= 0.03) {
      continue;
    }

    const color = meteorColor(shower.v, magnitude);
    const duration = clamp(0.15 + (6.5 - magnitude) * 0.15, 0.15, 1.5);
    const opacity = clamp(
      tuning.meteors.streakBrightness *
      THREE.MathUtils.lerp(0.22, 1.15, clamp((6.5 - magnitude) / 6.5, 0, 1)) *
      startVisibility,
      0.05,
      1.5
    );
    const meteor = system.pool.find((entry) => !entry.active);

    if (!meteor) {
      return false;
    }

    activateMeteor(
      meteor,
      shower.name,
      color,
      magnitude,
      duration,
      birthTime,
      startDirection,
      endDirection,
      opacity
    );
    return true;
  }

  return false;
}

function spawnSporadic(system, latitude, sunAltitude, birthTime) {
  const magnitude = sampleMeteorMagnitude(2.8);

  if (magnitude > tuning.meteors.minMagnitude) {
    return false;
  }

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const altitude = THREE.MathUtils.randFloat(12, 82);
    const azimuth = Math.random() * 360;
    const startDirection = altAzToDirection(altitude, azimuth);
    const { tangentX, tangentY } = buildTangentBasis(startDirection);
    const directionSign = latitude >= 0 ? -1 : 1;
    const downwardBias = new THREE.Vector3(0, directionSign, 0)
      .addScaledVector(tangentX, THREE.MathUtils.randFloatSpread(0.9))
      .addScaledVector(tangentY, THREE.MathUtils.randFloatSpread(0.9));
    const tangent = downwardBias.addScaledVector(startDirection, -downwardBias.dot(startDirection)).normalize();
    const angularLengthDeg = THREE.MathUtils.randFloat(3, 18);
    const endDirection = new THREE.Vector3()
      .copy(startDirection)
      .multiplyScalar(Math.cos(THREE.MathUtils.degToRad(angularLengthDeg)))
      .addScaledVector(tangent, Math.sin(THREE.MathUtils.degToRad(angularLengthDeg)))
      .normalize();
    const endHorizontal = directionToHorizontal(endDirection);
    const visibility = computeAttenuation(altitude, sunAltitude, 'stars').brightness;

    if (endHorizontal.alt <= -6 || visibility <= 0.03) {
      continue;
    }

    const velocity = THREE.MathUtils.randFloat(18, 56);
    const color = meteorColor(velocity, magnitude);
    const duration = clamp(0.12 + (6.5 - magnitude) * 0.12, 0.12, 1.2);
    const opacity = clamp(
      tuning.meteors.streakBrightness *
      THREE.MathUtils.lerp(0.18, 0.95, clamp((6.5 - magnitude) / 6.5, 0, 1)) *
      visibility,
      0.04,
      1.2
    );
    const meteor = system.pool.find((entry) => !entry.active);

    if (!meteor) {
      return false;
    }

    activateMeteor(
      meteor,
      'sporadic',
      color,
      magnitude,
      duration,
      birthTime,
      startDirection,
      endDirection,
      opacity
    );
    return true;
  }

  return false;
}

export function createMeteorShowers(scene) {
  const group = new THREE.Group();
  group.name = 'MeteorShowers';
  scene.add(group);

  const headTexture = createHeadTexture();
  const radiantMarker = new THREE.Sprite(new THREE.SpriteMaterial({
    map: createRadiantMarkerTexture(),
    color: 0xfff2cf,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  }));
  radiantMarker.visible = false;
  radiantMarker.scale.setScalar(RADIANT_MARKER_SIZE);
  radiantMarker.frustumCulled = false;
  group.add(radiantMarker);
  const pool = Array.from({ length: tuning.meteors.maxActive }, () => createMeteorInstance(headTexture));

  for (const meteor of pool) {
    group.add(meteor.line);
    group.add(meteor.head);
  }

  return {
    group,
    pool,
    radiantMarker,
    radiantMarkerVisible: false,
    observerPosition: new THREE.Vector3(),
    activeShowerName: null,
    activeShowerCode: null,
    activeRate: 0,
    activeZHR: 0,
    activeCount: 0,
    solarLongitude: 0,
    radiantAlt: null,
    radiantAz: null,
  };
}

export function updateMeteorShowers(system, {
  jd,
  lst,
  latitude,
  deltaSeconds = 0,
  sunAltitude = -90,
  observerPosition = null,
  timeSeconds = 0,
} = {}) {
  if (observerPosition) {
    system.observerPosition.copy(observerPosition);
  }

  if (!tuning.meteors.enabled) {
    for (const meteor of system.pool) {
      deactivateMeteor(meteor);
    }
    system.radiantMarker.visible = false;
    system.activeShowerName = null;
    system.activeShowerCode = null;
    system.activeRate = 0;
    system.activeZHR = 0;
    system.activeCount = 0;
    system.solarLongitude = 0;
    system.radiantAlt = null;
    system.radiantAz = null;
    return;
  }

  const currentLambda = solarLongitude(jd);
  system.solarLongitude = currentLambda;
  const nightFactor = computeAttenuation(55, sunAltitude, 'stars').brightness;
  let strongestShower = null;
  let strongestShowerCode = null;
  let strongestRate = 0;
  let strongestZHR = 0;
  let strongestRadiant = null;

  for (const shower of METEOR_SHOWERS) {
    const radiant = currentRadiant(shower, currentLambda, lst, latitude);
    const activity = showerActivity(shower, currentLambda);

    if (activity <= 0 || radiant.horizontal.alt <= 0) {
      continue;
    }

    const rate =
      activity *
      Math.sin(THREE.MathUtils.degToRad(radiant.horizontal.alt)) *
      nightFactor *
      tuning.meteors.showerMultiplier;

    if (rate > strongestRate) {
      strongestRate = rate;
      strongestZHR = activity * tuning.meteors.showerMultiplier;
      strongestShower = shower.name;
      strongestShowerCode = shower.code;
      strongestRadiant = radiant.horizontal;
    }

    if (deltaSeconds > 0 && nightFactor > 0.01) {
      const expectedThisFrame = (rate / 3600) * deltaSeconds;
      const spawnCount = poissonCount(expectedThisFrame);

      for (let index = 0; index < spawnCount; index += 1) {
        spawnFromRadiant(system, shower, currentLambda, lst, latitude, sunAltitude, timeSeconds);
      }
    }
  }

  if (deltaSeconds > 0 && nightFactor > 0.01) {
    const sporadicExpected = (tuning.meteors.sporadicRate * nightFactor / 3600) * deltaSeconds;
    const sporadicCount = poissonCount(sporadicExpected);

    for (let index = 0; index < sporadicCount; index += 1) {
      spawnSporadic(system, latitude, sunAltitude, timeSeconds);
    }
  }

  for (const meteor of system.pool) {
    if (meteor.active) {
      drawMeteor(meteor, system.observerPosition, timeSeconds);
    }
  }

  system.activeCount = system.pool.reduce((count, meteor) => count + (meteor.active ? 1 : 0), 0);
  system.activeShowerName = strongestShower;
  system.activeShowerCode = strongestShowerCode;
  system.activeRate = strongestRate;
  system.activeZHR = strongestZHR;
  system.radiantAlt = strongestRadiant?.alt ?? null;
  system.radiantAz = strongestRadiant?.az ?? null;

  if (system.radiantMarkerVisible && strongestRadiant && nightFactor > 0.01) {
    const markerPosition = horizontalToCartesian(strongestRadiant.alt, strongestRadiant.az, SKY_RADIUS);
    system.radiantMarker.position
      .set(markerPosition.x, markerPosition.y, markerPosition.z)
      .add(system.observerPosition);
    system.radiantMarker.material.opacity = Math.min(
      1.6,
      computeAttenuation(strongestRadiant.alt, sunAltitude, 'stars').brightness * 1.35
    );
    system.radiantMarker.visible = system.radiantMarker.material.opacity > 0.02;
  } else {
    system.radiantMarker.visible = false;
  }
}

export function getMeteorShowerStats(system) {
  return {
    activeShowerName: system.activeShowerName,
    activeShowerCode: system.activeShowerCode,
    activeRate: system.activeRate,
    activeZHR: system.activeZHR,
    activeCount: system.activeCount,
    solarLongitude: system.solarLongitude,
    radiantAlt: system.radiantAlt,
    radiantAz: system.radiantAz,
  };
}

export function setMeteorRadiantMarkerVisible(system, visible) {
  system.radiantMarkerVisible = Boolean(visible);

  if (!system.radiantMarkerVisible) {
    system.radiantMarker.visible = false;
  }

  return system.radiantMarkerVisible;
}

export function toggleMeteorRadiantMarker(system) {
  return setMeteorRadiantMarkerVisible(system, !system.radiantMarkerVisible);
}
