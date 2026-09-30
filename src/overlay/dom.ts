import css from './overlay.css?inline';
import iconSvg from '../assets/icon.svg?raw';

/**
 * Creates a host element with a closed shadow root so that the news site's CSS
 * cannot affect our UI and ours cannot leak into the page.
 */
export function createShadowHost(hostStyle: string): { host: HTMLElement; root: ShadowRoot } {
  const host = document.createElement('abolotse-ui');
  host.style.cssText = `all: initial; ${hostStyle}`;
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = css;
  root.append(style);
  return { host, root };
}

export function iconElement(className = 'icon'): HTMLElement {
  const box = el('div', className);
  box.setAttribute('aria-hidden', 'true');
  const svg = new DOMParser().parseFromString(iconSvg, 'image/svg+xml').documentElement;
  box.append(document.importNode(svg, true));
  return box;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

export function mount(host: HTMLElement): void {
  (document.body ?? document.documentElement).appendChild(host);
}
