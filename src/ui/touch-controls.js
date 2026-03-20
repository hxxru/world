function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function styleZone(zone, labelText) {
  zone.style.position = 'fixed';
  zone.style.bottom = 'max(116px, calc(env(safe-area-inset-bottom) + 96px))';
  zone.style.height = 'min(34vh, 240px)';
  zone.style.border = '1px dashed rgba(212, 168, 87, 0.12)';
  zone.style.borderRadius = '20px';
  zone.style.background = 'rgba(4, 8, 14, 0.02)';
  zone.style.touchAction = 'none';
  zone.style.userSelect = 'none';
  zone.style.webkitUserSelect = 'none';
  zone.style.pointerEvents = 'auto';

  const label = document.createElement('div');
  label.textContent = labelText;
  label.style.position = 'absolute';
  label.style.left = '14px';
  label.style.bottom = '12px';
  label.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  label.style.fontSize = '10px';
  label.style.letterSpacing = '0.08em';
  label.style.textTransform = 'uppercase';
  label.style.color = 'rgba(245, 230, 200, 0.28)';
  zone.appendChild(label);
}

export function createTouchControls({ onMove, onLook, onJump } = {}) {
  const root = document.createElement('div');
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.zIndex = '13';
  root.style.pointerEvents = 'none';
  root.style.display = 'none';

  const moveZone = document.createElement('div');
  moveZone.style.left = '16px';
  moveZone.style.width = 'calc(42vw - 16px)';
  styleZone(moveZone, 'Move');
  root.appendChild(moveZone);

  const lookZone = document.createElement('div');
  lookZone.style.right = '16px';
  lookZone.style.width = 'calc(48vw - 16px)';
  styleZone(lookZone, 'Look');
  root.appendChild(lookZone);

  const jumpButton = document.createElement('button');
  jumpButton.type = 'button';
  jumpButton.textContent = 'Jump';
  jumpButton.style.position = 'fixed';
  jumpButton.style.right = '16px';
  jumpButton.style.bottom = 'max(120px, calc(env(safe-area-inset-bottom) + 102px))';
  jumpButton.style.zIndex = '14';
  jumpButton.style.width = '72px';
  jumpButton.style.height = '72px';
  jumpButton.style.border = '1px solid rgba(212, 168, 87, 0.22)';
  jumpButton.style.borderRadius = '999px';
  jumpButton.style.background = 'rgba(4, 8, 14, 0.58)';
  jumpButton.style.color = '#f5e6c8';
  jumpButton.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  jumpButton.style.fontSize = '11px';
  jumpButton.style.pointerEvents = 'auto';
  jumpButton.style.touchAction = 'manipulation';
  jumpButton.addEventListener('click', () => {
    onJump?.();
  });
  root.appendChild(jumpButton);

  const movementState = {
    pointerId: null,
    originX: 0,
    originY: 0,
  };
  const lookState = {
    pointerId: null,
    lastX: 0,
    lastY: 0,
  };

  moveZone.addEventListener('pointerdown', (event) => {
    if (movementState.pointerId !== null) {
      return;
    }

    movementState.pointerId = event.pointerId;
    movementState.originX = event.clientX;
    movementState.originY = event.clientY;
    moveZone.setPointerCapture?.(event.pointerId);
  });

  moveZone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== movementState.pointerId) {
      return;
    }

    const deltaX = clamp((event.clientX - movementState.originX) / 56, -1, 1);
    const deltaY = clamp((event.clientY - movementState.originY) / 56, -1, 1);
    onMove?.(deltaX, deltaY);
  });

  const resetMove = (event) => {
    if (event.pointerId !== movementState.pointerId) {
      return;
    }

    movementState.pointerId = null;
    onMove?.(0, 0);
    if (moveZone.hasPointerCapture?.(event.pointerId)) {
      moveZone.releasePointerCapture(event.pointerId);
    }
  };

  moveZone.addEventListener('pointerup', resetMove);
  moveZone.addEventListener('pointercancel', resetMove);

  lookZone.addEventListener('pointerdown', (event) => {
    if (lookState.pointerId !== null) {
      return;
    }

    lookState.pointerId = event.pointerId;
    lookState.lastX = event.clientX;
    lookState.lastY = event.clientY;
    lookZone.setPointerCapture?.(event.pointerId);
  });

  lookZone.addEventListener('pointermove', (event) => {
    if (event.pointerId !== lookState.pointerId) {
      return;
    }

    const deltaX = event.clientX - lookState.lastX;
    const deltaY = event.clientY - lookState.lastY;
    lookState.lastX = event.clientX;
    lookState.lastY = event.clientY;
    onLook?.(deltaX, deltaY);
  });

  const resetLook = (event) => {
    if (event.pointerId !== lookState.pointerId) {
      return;
    }

    lookState.pointerId = null;
    if (lookZone.hasPointerCapture?.(event.pointerId)) {
      lookZone.releasePointerCapture(event.pointerId);
    }
  };

  lookZone.addEventListener('pointerup', resetLook);
  lookZone.addEventListener('pointercancel', resetLook);

  document.body.appendChild(root);

  return {
    root,
    jumpButton,
    setProfile(profile) {
      const isTouch = profile === 'touch';
      root.style.display = isTouch ? 'block' : 'none';
      if (!isTouch) {
        onMove?.(0, 0);
      }
    },
    setBlocked(blocked) {
      root.style.pointerEvents = blocked ? 'none' : 'none';
      moveZone.style.pointerEvents = blocked ? 'none' : 'auto';
      lookZone.style.pointerEvents = blocked ? 'none' : 'auto';
      jumpButton.disabled = blocked;
      jumpButton.style.opacity = blocked ? '0.45' : '1';
      if (blocked) {
        onMove?.(0, 0);
      }
    },
  };
}
