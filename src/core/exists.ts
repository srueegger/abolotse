import type { PublisherGroup } from '../publishers';
import { extractArticleId } from './match';

export type ExistsResult = 'exists' | 'missing' | 'unknown';

export const DEFAULT_TIMEOUT_MS = 3000;

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

export interface CheckOptions {
  group: PublisherGroup;
  targetUrl: string;
  articleId: string;
  fetchFn?: FetchFn;
  timeoutMs?: number;
}

/**
 * Checks whether an article exists on the target title.
 *
 * - `exists`: HTTP 200 on the target host with the same article ID in the final URL
 *   (or, on the GET fallback, in `og:url`/`canonical`).
 * - `missing`: HTTP 404, or the server bounced us to another host or to a page
 *   without the article ID (e.g. a section front).
 * - `unknown`: network error, timeout, redirect loop, server error. Never redirect.
 *
 * Cookies are required: Tamedia answers the first cookie-less request with a
 * 302 to itself that sets an entitlement cookie and loops without it.
 */
export async function checkArticleExists(options: CheckOptions): Promise<ExistsResult> {
  const { group, targetUrl, articleId } = options;
  const fetchFn = options.fetchFn ?? ((input, init) => fetch(input, init));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const targetHost = new URL(targetUrl).hostname;
  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const head = await fetchFn(targetUrl, requestInit('HEAD', signal));
    if (head.status !== 405 && head.status !== 501) {
      return evaluate(head, group, targetHost, articleId);
    }

    const get = await fetchFn(targetUrl, requestInit('GET', signal));
    const result = evaluate(get, group, targetHost, articleId);
    if (result !== 'exists' && get.status === 200 && new URL(get.url).hostname === targetHost) {
      const html = await get.text();
      return metaUrls(html).some((u) => idOf(group, u) === articleId) ? 'exists' : 'missing';
    }
    return result;
  } catch {
    return 'unknown';
  }
}

function requestInit(method: 'HEAD' | 'GET', signal: AbortSignal): RequestInit {
  return {
    method,
    credentials: 'include',
    redirect: 'follow',
    cache: 'no-store',
    signal,
  };
}

function evaluate(
  response: Response,
  group: PublisherGroup,
  targetHost: string,
  articleId: string,
): ExistsResult {
  if (response.status === 404 || response.status === 410) return 'missing';
  if (response.status !== 200) return 'unknown';
  // An empty url means an opaque or synthetic response we cannot judge.
  if (!response.url) return 'unknown';
  const finalUrl = new URL(response.url);
  if (finalUrl.hostname !== targetHost) return 'missing';
  return extractArticleId(group, finalUrl.pathname) === articleId ? 'exists' : 'missing';
}

function idOf(group: PublisherGroup, href: string): string | undefined {
  try {
    return extractArticleId(group, new URL(href).pathname);
  } catch {
    return undefined;
  }
}

/** Extracts `og:url` and `canonical` URLs without a DOM (service workers have none). */
export function metaUrls(html: string): string[] {
  const urls: string[] = [];
  for (const tag of html.match(/<(?:meta|link)\b[^>]*>/gi) ?? []) {
    const isOgUrl = /\bproperty\s*=\s*["']og:url["']/i.test(tag);
    const isCanonical = /\brel\s*=\s*["']canonical["']/i.test(tag);
    if (!isOgUrl && !isCanonical) continue;
    const value = /\b(?:content|href)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (value) urls.push(value);
  }
  return urls;
}
