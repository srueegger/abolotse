import { t } from '../i18n';
import { createShadowUi, el, iconElement } from './dom';

const AUTO_HIDE_MS = 8000;

export interface NoticeHandle {
  close: () => void;
}

/**
 * Shows a small, non-modal notice that the article is not available at the
 * user's own title. It does not take focus and hides itself after a while,
 * unless the pointer or keyboard focus is on it.
 */
export function showMissingNotice(targetName: string): NoticeHandle {
  const ui = createShadowUi();

  const notice = el('div', 'notice');
  notice.setAttribute('role', 'status');

  const text = el('div', 'notice-text');
  const heading = el('p', 'notice-heading');
  const body = el('p');
  text.append(heading, body);

  const closeButton = el('button', 'notice-close');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', t('noticeClose'));
  closeButton.title = t('noticeClose');
  closeButton.textContent = '×';

  notice.append(iconElement('notice-icon'), text, closeButton);
  ui.root.append(notice);

  let timer: number | undefined;
  let closed = false;
  const schedule = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(close, AUTO_HIDE_MS);
  };
  const pause = () => window.clearTimeout(timer);

  function close() {
    if (closed) return;
    closed = true;
    window.clearTimeout(timer);
    ui.remove();
  }

  closeButton.addEventListener('click', close);
  notice.addEventListener('mouseenter', pause);
  notice.addEventListener('mouseleave', schedule);
  notice.addEventListener('focusin', pause);
  notice.addEventListener('focusout', schedule);

  ui.show(notice);
  // Fill the live region after it is in the page, otherwise screen readers
  // may not announce it.
  requestAnimationFrame(() => {
    heading.textContent = t('noticeMissingHeading', targetName);
    body.textContent = t('noticeMissingBody', targetName);
  });
  schedule();
  return { close };
}
