import type { PublisherGroup, PublisherTitle } from '../publishers';

const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'yclid',
  'igshid',
  'twclid',
  'ttclid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmi',
  'mkt_tok',
  'ref_src',
  's_cid',
]);

export function isTrackingParam(name: string): boolean {
  const key = name.toLowerCase();
  return key.startsWith('utm_') || TRACKING_PARAMS.has(key);
}

/** Removes tracking parameters, keeps every other query parameter and the hash. */
export function stripTracking(url: URL): URL {
  const clean = new URL(url.href);
  for (const name of [...clean.searchParams.keys()]) {
    if (isTrackingParam(name)) clean.searchParams.delete(name);
  }
  // Avoid a dangling "?" when every parameter was removed.
  if (clean.searchParams.size === 0) clean.search = '';
  return clean;
}

export function buildTargetUrl(group: PublisherGroup, target: PublisherTitle, source: URL): string {
  return group.buildUrl(target.domain, stripTracking(source));
}
