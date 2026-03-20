import { createModal } from './modal.js';

function createSection(root, title, lines) {
  const section = document.createElement('section');
  section.style.marginBottom = '18px';

  const heading = document.createElement('div');
  heading.textContent = title;
  heading.style.marginBottom = '8px';
  heading.style.fontSize = '10px';
  heading.style.letterSpacing = '0.08em';
  heading.style.textTransform = 'uppercase';
  heading.style.color = '#d4a857';
  section.appendChild(heading);

  for (const line of lines) {
    const text = document.createElement('div');
    text.textContent = line;
    text.style.marginBottom = '6px';
    text.style.color = '#f5e6c8';
    text.style.fontSize = '12px';
    section.appendChild(text);
  }

  root.appendChild(section);
}

export function createInfoModal() {
  const modal = createModal({ title: 'How To Play', width: 'min(620px, calc(100vw - 32px))' });
  const intro = document.createElement('p');
  intro.textContent = 'Explore a procedural world under an astronomically accurate sky. Desktop stays keyboard-first; touch devices switch to on-screen movement and look controls.';
  intro.style.margin = '0 0 16px';
  intro.style.color = 'rgba(245, 230, 200, 0.78)';
  modal.body.appendChild(intro);

  createSection(modal.body, 'Desktop', [
    'Move with WASD.',
    'Jump with Space.',
    'Hold right-click and drag to look around.',
    'Open Settings with ` and Info with I.',
  ]);

  createSection(modal.body, 'Mobile', [
    'Use the left touch zone to move.',
    'Use the right touch zone to look around.',
    'Use the jump button near the bottom-right.',
    'Settings and Info stay available from the on-screen buttons.',
  ]);

  createSection(modal.body, 'Time Controls', [
    'Use the bottom-right strip to pause, change speed, and jump by week, month, or year.',
    'Press - to reverse time direction while keeping the current speed.',
  ]);

  createSection(modal.body, 'Location And Sky', [
    'Use the pin button at bottom-left to enter latitude, longitude, and date.',
    'Press C to toggle constellation lines.',
    'Press H or 9 to toggle the HUD.',
    'Press P to toggle the Polaris marker.',
    'Press O to cycle spawn-mode override for testing.',
  ]);

  return modal;
}
