import css from './overlay.css?inline';
import iconSvg from '../assets/icon.svg?raw';

export interface ShadowUi {
  root: ShadowRoot;
  /** Adds the UI to the page and shows `layer` in the top layer. */
  show: (layer: HTMLElement) => void;
  remove: () => void;
}

/**
 * Creates UI in a closed shadow root so that the news site's CSS cannot affect
 * it and ours cannot leak into the page.
 *
 * News sites stack ads, banners and consent dialogs with huge z-indexes and may
 * re-render the document. Therefore the UI is shown in the browser's top layer
 * (Popover API), where no page element can cover it, and it is re-attached if
 * the page removes it.
 */
export function createShadowUi(): ShadowUi {
  const host = document.createElement('abolotse-ui');
  host.style.cssText = 'all: initial;';
  const root = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = css;
  root.append(style);

  let layer: HTMLElement | undefined;
  let removed = false;

  const attach = () => {
    // <html> instead of <body>: frameworks re-render the body, not the root.
    document.documentElement.append(host);
    if (layer && 'showPopover' in layer && !layer.matches(':popover-open')) {
      layer.showPopover();
    }
  };
  const observer = new MutationObserver(() => {
    if (!removed && !host.isConnected) attach();
  });

  return {
    root,
    show(element) {
      layer = element;
      layer.setAttribute('popover', 'manual');
      attach();
      observer.observe(document.documentElement, { childList: true });
    },
    remove() {
      removed = true;
      observer.disconnect();
      host.remove();
    },
  };
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
