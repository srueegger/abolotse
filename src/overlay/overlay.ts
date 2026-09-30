import { t } from '../i18n';
import { createShadowHost, el, iconElement, mount } from './dom';

export interface OverlayOptions {
  targetName: string;
  /** Seconds until `onRead` is called automatically. */
  countdown: number;
  onRead: () => void;
  onStay: () => void;
}

export interface OverlayHandle {
  close: () => void;
}

/** Shows the modal redirect notice with countdown. */
export function showOverlay(options: OverlayOptions): OverlayHandle {
  const previousFocus = document.activeElement as HTMLElement | null;
  const { host, root } = createShadowHost('position: fixed; inset: 0; z-index: 2147483647;');

  const dialog = el('div', 'dialog');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'heading');
  dialog.setAttribute('aria-describedby', 'body');

  const heading = el('h2');
  heading.id = 'heading';
  heading.textContent = t('overlayHeading', options.targetName);
  const body = el('p');
  body.id = 'body';
  body.textContent = t('overlayBody', options.targetName);

  const countdownText = el('p', 'countdown');
  countdownText.setAttribute('aria-hidden', 'true');
  const progress = el('div', 'progress');
  progress.setAttribute('aria-hidden', 'true');
  const bar = el('div', 'bar');
  bar.style.animationDuration = `${options.countdown}s`;
  progress.append(bar);

  const stayButton = el('button', 'secondary');
  stayButton.type = 'button';
  stayButton.textContent = t('overlayStay');
  const readButton = el('button', 'primary');
  readButton.type = 'button';
  readButton.textContent = t('overlayReadNow');
  const actions = el('div', 'actions');
  actions.append(stayButton, readButton);

  dialog.append(iconElement(), heading, body, countdownText, progress, actions);
  root.append(el('div', 'backdrop'), dialog);

  let remaining = options.countdown;
  let closed = false;
  const renderCountdown = () => {
    countdownText.textContent =
      remaining <= 0
        ? t('overlayRedirecting')
        : remaining === 1
          ? t('overlayCountdownOne')
          : t('overlayCountdownOther', String(remaining));
  };
  renderCountdown();

  const timer = window.setInterval(() => {
    remaining -= 1;
    renderCountdown();
    if (remaining <= 0) read();
  }, 1000);

  function close() {
    if (closed) return;
    closed = true;
    window.clearInterval(timer);
    document.removeEventListener('keydown', onKeydown, true);
    host.remove();
  }

  function read() {
    window.clearInterval(timer);
    options.onRead();
  }

  function stay() {
    close();
    previousFocus?.focus?.();
    options.onStay();
  }

  // Keydown is captured on the document because the page may stop propagation.
  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      stay();
    } else if (event.key === 'Tab') {
      // Focus trap between the two buttons.
      event.preventDefault();
      event.stopImmediatePropagation();
      (root.activeElement === readButton ? stayButton : readButton).focus();
    }
  }

  readButton.addEventListener('click', read);
  stayButton.addEventListener('click', stay);
  document.addEventListener('keydown', onKeydown, true);

  mount(host);
  readButton.focus();

  return { close };
}
