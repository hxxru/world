import { createModal } from './modal.js';

function createSection(root, title, description = '') {
  const section = document.createElement('section');
  section.style.marginBottom = '18px';

  const heading = document.createElement('div');
  heading.textContent = title;
  heading.style.marginBottom = '6px';
  heading.style.fontSize = '10px';
  heading.style.letterSpacing = '0.08em';
  heading.style.textTransform = 'uppercase';
  heading.style.color = '#d4a857';
  section.appendChild(heading);

  if (description) {
    const text = document.createElement('p');
    text.textContent = description;
    text.style.margin = '0 0 10px';
    text.style.color = 'rgba(245, 230, 200, 0.74)';
    text.style.fontSize = '11px';
    section.appendChild(text);
  }

  const body = document.createElement('div');
  section.appendChild(body);
  root.appendChild(section);
  return body;
}

function createRow(root) {
  const row = document.createElement('div');
  row.style.display = 'grid';
  row.style.gridTemplateColumns = 'minmax(0, 1fr) auto auto';
  row.style.alignItems = 'center';
  row.style.gap = '10px';
  row.style.padding = '10px 0';
  row.style.borderTop = '1px solid rgba(212, 168, 87, 0.1)';
  root.appendChild(row);
  return row;
}

function createMeta(label, description = '') {
  const meta = document.createElement('div');

  const heading = document.createElement('div');
  heading.textContent = label;
  heading.style.color = '#f5e6c8';
  heading.style.fontSize = '12px';
  meta.appendChild(heading);

  if (description) {
    const text = document.createElement('div');
    text.textContent = description;
    text.style.color = 'rgba(245, 230, 200, 0.66)';
    text.style.fontSize = '10px';
    text.style.marginTop = '2px';
    meta.appendChild(text);
  }

  return meta;
}

function createKeycap(value) {
  const keycap = document.createElement('span');
  keycap.textContent = value;
  keycap.style.padding = '4px 7px';
  keycap.style.border = '1px solid rgba(212, 168, 87, 0.18)';
  keycap.style.borderRadius = '999px';
  keycap.style.color = '#d7c6a0';
  keycap.style.fontSize = '10px';
  keycap.style.whiteSpace = 'nowrap';
  return keycap;
}

function createActionButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.style.minWidth = '76px';
  button.style.padding = '8px 10px';
  button.style.border = '1px solid rgba(212, 168, 87, 0.24)';
  button.style.borderRadius = '10px';
  button.style.background = 'rgba(255, 255, 255, 0.03)';
  button.style.color = '#f5e6c8';
  button.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  button.style.fontSize = '11px';
  button.style.cursor = 'pointer';
  return button;
}

function createToggleRow(root, { label, description, shortcut, onToggle }) {
  const row = createRow(root);
  row.appendChild(createMeta(label, description));
  row.appendChild(createKeycap(shortcut));

  const button = createActionButton('Off');
  button.addEventListener('click', () => {
    onToggle?.();
  });
  row.appendChild(button);

  return button;
}

function createActionRow(root, { label, description, shortcut, buttonLabel, onClick }) {
  const row = createRow(root);
  row.appendChild(createMeta(label, description));
  row.appendChild(createKeycap(shortcut));

  const button = createActionButton(buttonLabel);
  button.addEventListener('click', () => {
    onClick?.();
  });
  row.appendChild(button);
  return button;
}

function createRangeRow(root, { label, description, min, max, step, suffix = '', onInput }) {
  const wrapper = document.createElement('label');
  wrapper.style.display = 'block';
  wrapper.style.padding = '10px 0';
  wrapper.style.borderTop = '1px solid rgba(212, 168, 87, 0.1)';

  const top = document.createElement('div');
  top.style.display = 'flex';
  top.style.justifyContent = 'space-between';
  top.style.gap = '12px';
  top.style.marginBottom = '6px';
  wrapper.appendChild(top);

  top.appendChild(createMeta(label, description));

  const value = document.createElement('span');
  value.style.color = '#d4a857';
  value.style.fontSize = '11px';
  value.style.whiteSpace = 'nowrap';
  top.appendChild(value);

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.style.width = '100%';
  input.style.margin = '0';
  input.style.accentColor = '#d4a857';
  input.addEventListener('input', () => {
    const nextValue = Number(input.value);
    onInput?.(nextValue);
    value.textContent = `${nextValue}${suffix}`;
  });
  wrapper.appendChild(input);

  root.appendChild(wrapper);
  return {
    input,
    value,
    setValue(nextValue) {
      input.value = String(nextValue);
      value.textContent = `${nextValue}${suffix}`;
    },
  };
}

export function createSettingsModal({
  onToggleHud,
  onToggleConstellations,
  onTogglePolaris,
  onOpenInfo,
  onDesktopLookSensitivityChange,
  onTouchLookSensitivityChange,
  onBloomStrengthChange,
  onStarLimitingMagnitudeChange,
  onConstellationOpacityChange,
} = {}) {
  const modal = createModal({ title: 'Settings' });
  const { body } = modal;

  const intro = document.createElement('p');
  intro.style.margin = '0 0 16px';
  intro.style.color = 'rgba(245, 230, 200, 0.78)';
  intro.textContent = 'Persistent display and control settings. Keyboard shortcuts still work on desktop.';
  body.appendChild(intro);

  const displaySection = createSection(body, 'Display');
  const hudToggle = createToggleRow(displaySection, {
    label: 'HUD',
    description: 'Date, time, observer coordinates, and body telemetry.',
    shortcut: 'H / 9',
    onToggle: onToggleHud,
  });
  const constellationToggle = createToggleRow(displaySection, {
    label: 'Constellation lines',
    description: 'Show or hide the active sky culture overlay.',
    shortcut: 'C',
    onToggle: onToggleConstellations,
  });
  const polarisToggle = createToggleRow(displaySection, {
    label: 'Polaris marker',
    description: 'Diagnostic marker for north-star alignment.',
    shortcut: 'P',
    onToggle: onTogglePolaris,
  });

  const controlsSection = createSection(body, 'Controls', 'Actions exposed here also remain available via keyboard shortcuts.');
  const profileRow = document.createElement('div');
  profileRow.style.padding = '10px 0';
  profileRow.style.borderTop = '1px solid rgba(212, 168, 87, 0.1)';
  profileRow.style.color = 'rgba(245, 230, 200, 0.74)';
  profileRow.style.fontSize = '11px';
  controlsSection.appendChild(profileRow);

  createActionRow(controlsSection, {
    label: 'How to play',
    description: 'Reopen the onboarding and controls guide.',
    shortcut: 'I',
    buttonLabel: 'Open',
    onClick: onOpenInfo,
  });

  const sensitivitySection = createSection(body, 'Sensitivity');
  const desktopLook = createRangeRow(sensitivitySection, {
    label: 'Desktop look',
    description: 'Mouse/right-drag look sensitivity.',
    min: 0.001,
    max: 0.0064,
    step: 0.0001,
    onInput: onDesktopLookSensitivityChange,
  });
  const touchLook = createRangeRow(sensitivitySection, {
    label: 'Touch look',
    description: 'Drag sensitivity for the right-side touch look zone.',
    min: 0.0006,
    max: 0.004,
    step: 0.0001,
    onInput: onTouchLookSensitivityChange,
  });

  const visualsSection = createSection(body, 'Visual tuning');
  const bloomStrength = createRangeRow(visualsSection, {
    label: 'Bloom strength',
    description: 'Night-sky glow intensity.',
    min: 0,
    max: 1.3,
    step: 0.05,
    onInput: onBloomStrengthChange,
  });
  const limitingMagnitude = createRangeRow(visualsSection, {
    label: 'Star limiting magnitude',
    description: 'Higher values show dimmer stars.',
    min: 4,
    max: 10,
    step: 0.5,
    onInput: onStarLimitingMagnitudeChange,
  });
  const constellationOpacity = createRangeRow(visualsSection, {
    label: 'Constellation opacity',
    description: 'Overlay line opacity for visible segments.',
    min: 0,
    max: 0.96,
    step: 0.05,
    onInput: onConstellationOpacityChange,
  });

  return {
    ...modal,
    refresh(state) {
      hudToggle.textContent = state.hudVisible ? 'On' : 'Off';
      constellationToggle.textContent = state.constellationsVisible ? 'On' : 'Off';
      polarisToggle.textContent = state.polarisVisible ? 'On' : 'Off';
      profileRow.textContent = `Active input profile: ${state.inputProfile}`;
      desktopLook.setValue(Number(state.desktopLookSensitivity.toFixed(4)));
      touchLook.setValue(Number(state.touchLookSensitivity.toFixed(4)));
      bloomStrength.setValue(Number(state.bloomStrength.toFixed(2)));
      limitingMagnitude.setValue(Number(state.starLimitingMagnitude.toFixed(1)));
      constellationOpacity.setValue(Number(state.constellationOpacity.toFixed(2)));
    },
  };
}
