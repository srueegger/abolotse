import { browser } from 'wxt/browser';
import type messages from '../public/_locales/en/messages.json';

export type MessageKey = keyof typeof messages;

export function t(key: MessageKey, substitutions?: string | string[]): string {
  return browser.i18n.getMessage(key, substitutions) || key;
}

/** Localises the document language and all elements with `data-i18n="key"`. */
export function applyI18n(root: ParentNode = document): void {
  document.documentElement.lang = browser.i18n.getUILanguage();
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n as MessageKey);
  }
}
