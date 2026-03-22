import { createModal } from './modal.js';

function pad(value, width = 2) {
  return String(Math.abs(value)).padStart(width, '0');
}

function formatYear(year) {
  if (year >= 0) {
    return String(year).padStart(4, '0');
  }

  return `-${pad(year, 4)}`;
}

function formatDateForInput(gregorian) {
  return `${formatYear(gregorian.year)}-${pad(gregorian.month)}-${pad(gregorian.day)}`;
}

function formatDegrees(value, digits = 3) {
  return value >= 0 ? `+${value.toFixed(digits)}` : value.toFixed(digits);
}

function setFieldValueIfIdle(field, value) {
  if (document.activeElement !== field) {
    field.value = value;
  }
}

function styleField(input) {
  input.style.width = '100%';
  input.style.padding = '8px 10px';
  input.style.border = '1px solid rgba(212, 168, 87, 0.2)';
  input.style.borderRadius = '10px';
  input.style.background = 'rgba(255, 255, 255, 0.03)';
  input.style.color = '#f5e6c8';
  input.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  input.style.fontSize = '11px';
  input.style.outline = 'none';
  input.style.boxSizing = 'border-box';
}

function createLabeledField(root, labelText, input) {
  const wrapper = document.createElement('label');
  wrapper.style.display = 'block';
  wrapper.style.marginBottom = '10px';

  const label = document.createElement('div');
  label.textContent = labelText;
  label.style.marginBottom = '5px';
  label.style.fontSize = '10px';
  label.style.letterSpacing = '0.06em';
  label.style.textTransform = 'uppercase';
  label.style.color = '#d4a857';

  wrapper.appendChild(label);
  wrapper.appendChild(input);
  root.appendChild(wrapper);
}

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

function createPresetButtonsRow(root, { label, description, presets = [], onSelect }) {
  const wrapper = document.createElement('div');
  wrapper.style.padding = '10px 0';
  wrapper.style.borderTop = '1px solid rgba(212, 168, 87, 0.1)';

  wrapper.appendChild(createMeta(label, description));

  const buttons = document.createElement('div');
  buttons.style.display = 'flex';
  buttons.style.flexWrap = 'wrap';
  buttons.style.gap = '8px';
  buttons.style.marginTop = '8px';
  wrapper.appendChild(buttons);

  const entries = presets.map((preset) => {
    const button = createActionButton(preset.label);
    button.style.minWidth = '64px';
    button.addEventListener('click', () => {
      onSelect?.(preset.value);
    });
    buttons.appendChild(button);
    return {
      ...preset,
      button,
    };
  });

  root.appendChild(wrapper);

  return {
    setActive(value) {
      for (const entry of entries) {
        const active = entry.value === value;
        entry.button.style.background = active ? 'rgba(212, 168, 87, 0.18)' : 'rgba(255, 255, 255, 0.03)';
        entry.button.style.borderColor = active ? 'rgba(212, 168, 87, 0.46)' : 'rgba(212, 168, 87, 0.24)';
      }
    },
  };
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
  skyCultures = [],
  onApplyObserverSettings,
  onSkyCultureChange,
  onToggleHud,
  onToggleConstellations,
  onTogglePolaris,
  onOpenInfo,
  onTimeSpeedChange,
  onDesktopLookSensitivityChange,
  onTouchLookSensitivityChange,
  onBloomStrengthChange,
  onStarLimitingMagnitudeChange,
  onConstellationOpacityChange,
} = {}) {
  const modal = createModal({ title: 'Settings' });
  const { body } = modal;

  const observerSection = createSection(body, 'Observer', 'Current viewpoint and date.');
  const observerCurrent = document.createElement('div');
  observerCurrent.style.marginBottom = '10px';
  observerCurrent.style.fontSize = '10px';
  observerCurrent.style.lineHeight = '1.45';
  observerCurrent.style.color = '#d7c6a0';
  observerSection.appendChild(observerCurrent);

  const observerForm = document.createElement('form');
  observerSection.appendChild(observerForm);

  const latitude = document.createElement('input');
  latitude.type = 'number';
  latitude.min = '-90';
  latitude.max = '90';
  latitude.step = '0.0001';
  styleField(latitude);
  createLabeledField(observerForm, 'Latitude', latitude);

  const longitude = document.createElement('input');
  longitude.type = 'number';
  longitude.min = '-180';
  longitude.max = '180';
  longitude.step = '0.0001';
  styleField(longitude);
  createLabeledField(observerForm, 'Longitude', longitude);

  const date = document.createElement('input');
  date.type = 'text';
  styleField(date);
  createLabeledField(observerForm, 'Date', date);

  const observerSubmit = document.createElement('button');
  observerSubmit.type = 'submit';
  observerSubmit.textContent = 'Apply observer';
  observerSubmit.style.width = '100%';
  observerSubmit.style.padding = '10px 12px';
  observerSubmit.style.border = '1px solid rgba(212, 168, 87, 0.3)';
  observerSubmit.style.borderRadius = '10px';
  observerSubmit.style.background = 'rgba(212, 168, 87, 0.12)';
  observerSubmit.style.color = '#f5e6c8';
  observerSubmit.style.fontFamily = 'inherit';
  observerSubmit.style.fontSize = '11px';
  observerSubmit.style.cursor = 'pointer';
  observerForm.appendChild(observerSubmit);

  observerForm.addEventListener('submit', (event) => {
    event.preventDefault();
    onApplyObserverSettings?.({
      latitude: latitude.value.trim(),
      longitude: longitude.value.trim(),
      date: date.value.trim(),
    });
  });

  const skySection = createSection(body, 'Sky Culture', 'Applies immediately and persists between visits.');
  const skyCulture = document.createElement('select');
  styleField(skyCulture);
  skyCulture.style.cursor = 'pointer';
  for (const culture of skyCultures) {
    const option = document.createElement('option');
    option.value = culture.id;
    option.textContent = culture.label;
    option.style.background = '#0b111a';
    option.style.color = '#f5e6c8';
    skyCulture.appendChild(option);
  }
  createLabeledField(skySection, 'Culture', skyCulture);
  skyCulture.addEventListener('change', () => {
    onSkyCultureChange?.(skyCulture.value);
  });

  const displaySection = createSection(body, 'Display');
  const hudToggle = createToggleRow(displaySection, {
    label: 'HUD',
    description: 'Date, time, observer coordinates, and body telemetry.',
    shortcut: 'H',
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
    shortcut: 'M',
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
  createActionRow(controlsSection, {
    label: 'Play / pause',
    description: 'Toggle time playback without touching the time strip.',
    shortcut: 'P',
    buttonLabel: 'Toggle',
    onClick: onTimeSpeedChange ? () => onTimeSpeedChange('toggle-pause') : undefined,
  });

  const timeSection = createSection(body, 'Time Speed', 'Keyboard presets mirror the number row shortcuts.');
  const timeSpeedPresets = createPresetButtonsRow(timeSection, {
    label: 'Playback speed',
    description: '1, 2, 3, and 4 map to 1x, 60x, 360x, and 3600x.',
    presets: [
      { label: '1x', value: 1 },
      { label: '60x', value: 60 },
      { label: '360x', value: 360 },
      { label: '3600x', value: 3600 },
    ],
    onSelect: onTimeSpeedChange,
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
      const dateValue = formatDateForInput(state.gregorian);
      observerCurrent.textContent =
        `current:\nlat ${formatDegrees(state.latitude)}\nlon ${formatDegrees(state.longitude)}\ndate ${dateValue}`;
      setFieldValueIfIdle(latitude, state.latitude.toFixed(4));
      setFieldValueIfIdle(longitude, state.longitude.toFixed(4));
      setFieldValueIfIdle(date, dateValue);
      if (document.activeElement !== skyCulture) {
        skyCulture.value = state.skyCultureId;
      }
      hudToggle.textContent = state.hudVisible ? 'On' : 'Off';
      constellationToggle.textContent = state.constellationsVisible ? 'On' : 'Off';
      polarisToggle.textContent = state.polarisVisible ? 'On' : 'Off';
      profileRow.textContent = `Active input profile: ${state.inputProfile}`;
      timeSpeedPresets.setActive(Math.abs(state.speedMultiplier));
      desktopLook.setValue(Number(state.desktopLookSensitivity.toFixed(4)));
      touchLook.setValue(Number(state.touchLookSensitivity.toFixed(4)));
      bloomStrength.setValue(Number(state.bloomStrength.toFixed(2)));
      limitingMagnitude.setValue(Number(state.starLimitingMagnitude.toFixed(1)));
      constellationOpacity.setValue(Number(state.constellationOpacity.toFixed(2)));
    },
  };
}
