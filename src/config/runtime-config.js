export const tuning = {
  stars: {
    baseSize: 0.6,
    scaleFactor: 0.3,
    limitingMagnitude: 7,
    renderedCount: 0,
  },
  bloom: {
    strength: 0.65,
    radius: 0.3,
    threshold: 0.95,
  },
  planets: {
    spriteSize: 1,
    labelSize: 10,
  },
  sunMoon: {
    sunDiscSize: 1,
    moonDiscSize: 1,
    nightHalo: 0.15,
  },
  skyAttenuation: {
    transmittance: 0.9,
    maxAirmassClamp: 12,
    warmTint: {
      r: 1,
      g: 0.831,
      b: 0.627,
    },
    starsTwilightBright: -6,
    starsTwilightDark: -18,
    planetsTwilightBright: -3,
    planetsTwilightDark: -12,
  },
  atmosphere: {
    twilightIntensity: 1,
    nighttimeAmbientGlow: 0.08,
    moonglow: 0.4,
  },
  milkyWay: {
    brightness: 0.002,
    desaturation: 0.7,
  },
  constellationLines: {
    opacity: 0.48,
    linewidth: 1,
  },
  water: {
    rippleAmplitude: 1,
    rippleSpeed: 0.5,
    reflectivity: 0.8,
  },
  fog: {
    near: 800,
    far: 3100,
  },
  trees: {
    density: 3.5,
    heightScale: 1.7,
    clearingRadius: 22,
  },
  player: {
    moveSpeed: 30,
    acceleration: 18,
    damping: 12,
    desktopLookSensitivity: 0.0032,
    touchLookSensitivity: 0.0018,
    jumpHeight: 4.0,
    gravity: 40,
  },
  labels: {
    hoverThreshold: 30,
  },
};

const listeners = new Set();

function resolvePath(path) {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((current, key) => current[key], tuning);
  return { target, last };
}

export function getTuningValue(path) {
  return path.split('.').reduce((current, key) => current[key], tuning);
}

export function setTuningValue(path, value) {
  const { target, last } = resolvePath(path);
  target[last] = value;

  for (const listener of listeners) {
    listener(path, value, tuning);
  }
}

export function subscribeTuning(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
