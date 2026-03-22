export const CELESTIAL_SYMBOLS = {
  Moon: '\u263e',
  Mercury: '\u263f',
  Venus: '\u2640',
  Sun: '\u2609',
  Mars: '\u2642',
  Jupiter: '\u2643',
  Saturn: '\u2644',
};

export function appendCelestialSymbol(name) {
  const symbol = CELESTIAL_SYMBOLS[name];
  return symbol ? `${name} ${symbol}` : name;
}

export function getCelestialSymbol(name) {
  return CELESTIAL_SYMBOLS[name] ?? name;
}
