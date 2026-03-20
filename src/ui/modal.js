function focusableElements(root) {
  return [...root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => !element.hasAttribute('disabled'));
}

export function createModal({ title, width = 'min(560px, calc(100vw - 32px))' } = {}) {
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '30';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))';
  overlay.style.background = 'rgba(3, 6, 10, 0.72)';
  overlay.style.backdropFilter = 'blur(12px)';

  const panel = document.createElement('section');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.style.width = width;
  panel.style.maxWidth = '100%';
  panel.style.maxHeight = 'min(84vh, calc(100vh - 32px))';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.border = '1px solid rgba(212, 168, 87, 0.22)';
  panel.style.borderRadius = '18px';
  panel.style.background = 'rgba(4, 8, 14, 0.92)';
  panel.style.boxShadow = '0 24px 70px rgba(0, 0, 0, 0.42)';
  panel.style.overflow = 'hidden';
  overlay.appendChild(panel);

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.gap = '12px';
  header.style.padding = '16px 18px 14px';
  header.style.borderBottom = '1px solid rgba(212, 168, 87, 0.16)';
  panel.appendChild(header);

  const heading = document.createElement('h2');
  heading.textContent = title;
  heading.style.margin = '0';
  heading.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  heading.style.fontSize = '13px';
  heading.style.letterSpacing = '0.08em';
  heading.style.textTransform = 'uppercase';
  heading.style.color = '#f5e6c8';
  header.appendChild(heading);

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.style.border = '1px solid rgba(212, 168, 87, 0.28)';
  closeButton.style.borderRadius = '999px';
  closeButton.style.padding = '8px 12px';
  closeButton.style.background = 'rgba(255, 255, 255, 0.03)';
  closeButton.style.color = '#f5e6c8';
  closeButton.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  closeButton.style.fontSize = '11px';
  closeButton.style.cursor = 'pointer';
  header.appendChild(closeButton);

  const body = document.createElement('div');
  body.style.padding = '18px';
  body.style.overflowY = 'auto';
  body.style.color = '#f5e6c8';
  body.style.fontFamily = '"Space Mono", "IBM Plex Mono", monospace';
  body.style.fontSize = '12px';
  body.style.lineHeight = '1.5';
  panel.appendChild(body);

  let visible = false;
  let lastActiveElement = null;
  const openChangeListeners = new Set();

  function notifyOpenChange() {
    for (const listener of openChangeListeners) {
      listener(visible);
    }
  }

  function setOpen(nextVisible) {
    if (visible === nextVisible) {
      return;
    }

    visible = nextVisible;
    overlay.style.display = visible ? 'flex' : 'none';

    if (visible) {
      lastActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const focusables = focusableElements(panel);
      (focusables[0] ?? closeButton).focus();
    } else {
      lastActiveElement?.focus?.();
    }

    notifyOpenChange();
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      setOpen(false);
    }
  });

  closeButton.addEventListener('click', () => {
    setOpen(false);
  });

  panel.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.code !== 'Tab') {
      return;
    }

    const focusables = focusableElements(panel);

    if (focusables.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  document.body.appendChild(overlay);

  return {
    overlay,
    panel,
    body,
    heading,
    closeButton,
    get visible() {
      return visible;
    },
    setOpen,
    onOpenChange(listener) {
      openChangeListeners.add(listener);
      return () => {
        openChangeListeners.delete(listener);
      };
    },
  };
}
