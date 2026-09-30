import { browser } from 'wxt/browser';
import type { BackgroundRequest, ContentRequest, PageStatus } from '../messages';
import { showOverlay, type OverlayHandle } from '../overlay/overlay';
import { matchPatterns } from '../publishers';

export default defineContentScript({
  matches: matchPatterns(),
  runAt: 'document_start',

  main(ctx) {
    let status: PageStatus = { kind: 'checking' };
    let overlay: OverlayHandle | undefined;
    let run = 0;

    browser.runtime.onMessage.addListener((message: ContentRequest, _sender, sendResponse) => {
      if (message.type !== 'status') return false;
      sendResponse(status);
      return false;
    });

    async function check(href: string) {
      const current = ++run;
      overlay?.close();
      overlay = undefined;
      status = { kind: 'checking' };

      const response = await send({ type: 'check', url: href });
      if (current !== run || !ctx.isValid) return;
      status = response ?? { kind: 'skip', reason: 'not-article' };

      if (status.kind !== 'result' || status.result !== 'exists' || status.stayed) return;
      const { targetUrl, targetName, countdown } = status;

      if (countdown === 0) {
        location.replace(targetUrl);
        return;
      }

      await pageReady();
      if (current !== run || !ctx.isValid) return;
      overlay = showOverlay({
        targetName,
        countdown,
        onRead: () => location.replace(targetUrl),
        onStay: () => {
          void send({ type: 'stay', url: href }).then((next) => {
            if (next && current === run) status = next;
          });
        },
      });
    }

    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => void check(newUrl.href));
    ctx.onInvalidated(() => overlay?.close());
    void check(location.href);
  },
});

async function send(message: BackgroundRequest): Promise<PageStatus | undefined> {
  try {
    return (await browser.runtime.sendMessage(message)) as PageStatus | undefined;
  } catch {
    // Background unavailable (e.g. extension updated): never redirect.
    return undefined;
  }
}

/** Resolves once the body exists and the page is not a hidden prerender. */
async function pageReady(): Promise<void> {
  if (document.readyState === 'loading') {
    await new Promise((resolve) =>
      document.addEventListener('DOMContentLoaded', resolve, { once: true }),
    );
  }
  const doc = document as Document & { prerendering?: boolean };
  if (doc.prerendering) {
    await new Promise((resolve) =>
      document.addEventListener('prerenderingchange', resolve, { once: true }),
    );
  }
}
