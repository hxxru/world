function styleButton(button) {
  button.style.border = '1px solid rgba(212, 168, 87, 0.22)';
  button.style.borderRadius = '999px';
  button.style.padding = '9px 12px';
  button.style.background = 'rgba(4, 8, 14, 0.64)';
  button.style.color = '#f5e6c8';
  button.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  button.style.fontSize = '11px';
  button.style.cursor = 'pointer';
  button.style.backdropFilter = 'blur(8px)';
  button.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
}

export function createUtilityButtons({ onOpenSettings, onOpenInfo } = {}) {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.top = 'max(16px, env(safe-area-inset-top))';
  root.style.left = '16px';
  root.style.zIndex = '16';
  root.style.display = 'flex';
  root.style.gap = '8px';

  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.textContent = 'Settings';
  styleButton(settingsButton);
  settingsButton.addEventListener('click', () => {
    onOpenSettings?.();
  });
  root.appendChild(settingsButton);

  const infoButton = document.createElement('button');
  infoButton.type = 'button';
  infoButton.textContent = 'Info';
  styleButton(infoButton);
  infoButton.addEventListener('click', () => {
    onOpenInfo?.();
  });
  root.appendChild(infoButton);

  document.body.appendChild(root);

  return {
    root,
    settingsButton,
    infoButton,
  };
}
