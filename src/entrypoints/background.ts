import { browser } from 'wxt/browser';
import { checkArticleExists, type ExistsResult } from '../core/exists';
import { matchArticle, type ArticleMatch } from '../core/match';
import { decideRedirect, stayKey } from '../core/redirect';
import { t } from '../i18n';
import type { BackgroundRequest, PageStatus } from '../messages';
import { loadSettings } from '../settings';

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_PREFIX = 'check:';
const STAY_PREFIX = 'stay:';

interface CacheEntry {
  result: ExistsResult;
  at: number;
}

// Parallel requests for the same article (e.g. two tabs) share one fetch.
const inFlight = new Map<string, Promise<ExistsResult>>();

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      void browser.tabs.create({ url: `${browser.runtime.getURL('/options.html')}?welcome=1` });
    }
  });

  // sendResponse + `return true` works in every supported browser version,
  // returning a promise from the listener does not.
  browser.runtime.onMessage.addListener((message: BackgroundRequest, sender, sendResponse) => {
    if (sender.id !== browser.runtime.id || !sender.tab?.id) return false;
    const tabId = sender.tab.id;
    const task =
      message.type === 'check'
        ? handleCheck(message.url, tabId)
        : message.type === 'stay'
          ? handleStay(message.url, tabId)
          : undefined;
    if (!task) return false;
    task.then(sendResponse, (error: unknown) => {
      console.error('[abolotse]', error);
      sendResponse(undefined);
    });
    return true;
  });
});

async function handleCheck(href: string, tabId: number): Promise<PageStatus> {
  const url = new URL(href);
  const article = matchArticle(url);
  const stays =
    article && (await isStayed(article)) ? new Set([stayKey(article)]) : new Set<string>();
  const settings = await loadSettings();
  const decision = decideRedirect(url, settings, stays);

  if (decision.action === 'skip') {
    await setBadge(tabId, '');
    return {
      kind: 'skip',
      reason: decision.reason,
      titleName: decision.article?.title.name,
      groupName: decision.article?.group.name,
    };
  }

  const { target, targetUrl } = decision;
  const result = await cachedCheck(`${target.title.domain}:${decision.article.articleId}`, () =>
    checkArticleExists({
      group: decision.article.group,
      targetUrl,
      articleId: decision.article.articleId,
    }),
  );

  await updateBadge(tabId, result, decision.stayed, target.title.name);
  return {
    kind: 'result',
    result,
    targetName: target.title.name,
    targetUrl,
    stayed: decision.stayed,
    countdown: settings.countdown,
  };
}

async function handleStay(href: string, tabId: number): Promise<PageStatus> {
  const article = matchArticle(new URL(href));
  if (article) await browser.storage.session.set({ [STAY_PREFIX + stayKey(article)]: true });
  return handleCheck(href, tabId);
}

async function isStayed(article: ArticleMatch): Promise<boolean> {
  const key = STAY_PREFIX + stayKey(article);
  return Boolean((await browser.storage.session.get(key))[key]);
}

async function cachedCheck(key: string, run: () => Promise<ExistsResult>): Promise<ExistsResult> {
  const storageKey = CACHE_PREFIX + key;
  const stored = (await browser.storage.session.get(storageKey))[storageKey] as
    CacheEntry | undefined;
  if (stored && Date.now() - stored.at < CACHE_TTL_MS) return stored.result;

  let pending = inFlight.get(key);
  if (!pending) {
    pending = run().finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
  }
  const result = await pending;
  // Only definite answers are cached; a failed check is retried next time.
  if (result !== 'unknown') {
    await browser.storage.session.set({ [storageKey]: { result, at: Date.now() } });
  }
  return result;
}

async function updateBadge(
  tabId: number,
  result: ExistsResult,
  stayed: boolean,
  targetName: string,
): Promise<void> {
  if (result === 'exists' && stayed) {
    await setBadge(tabId, '✓', '#1a7f37', t('badgeAvailable', targetName));
  } else if (result === 'missing') {
    await setBadge(tabId, '–', '#6e7781', t('badgeMissing', targetName));
  } else {
    await setBadge(tabId, '');
  }
}

async function setBadge(tabId: number, text: string, color?: string, title?: string) {
  try {
    await browser.action.setBadgeText({ tabId, text });
    if (color) await browser.action.setBadgeBackgroundColor({ tabId, color });
    await browser.action.setTitle({ tabId, title: title ?? t('extName') });
  } catch {
    // The tab may have been closed in the meantime.
  }
}
