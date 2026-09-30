/**
 * Central publisher configuration.
 *
 * Adding a publisher means adding one entry to `PUBLISHER_GROUPS`. Content script
 * matches and host permissions are generated from this list (see wxt.config.ts),
 * and all redirect logic works on these generic fields only.
 *
 * Redirects only ever happen between titles of the same group.
 */

export type TitleLanguage = 'de' | 'fr' | 'it';

export interface PublisherTitle {
  /** Stable identifier, used in settings. Never rename once released. */
  id: string;
  /** Display name. Proper noun, therefore not translated. */
  name: string;
  /** Hostname that serves articles, including `www.` if the site uses it. */
  domain: string;
  language: TitleLanguage;
}

export interface PublisherGroup {
  /** Stable identifier, used in settings. Never rename once released. */
  id: string;
  name: string;
  /** Extracts the shared article ID from a pathname (first capture group). */
  articleIdPattern: RegExp;
  /** Builds the article URL on another title of the same group. */
  buildUrl: (targetDomain: string, originalUrl: URL) => string;
  titles: PublisherTitle[];
}

/** Keeps path, query and hash and only swaps the host. */
export function swapHost(targetDomain: string, originalUrl: URL): string {
  const url = new URL(originalUrl.href);
  url.hostname = targetDomain;
  return url.href;
}

// Tamedia article paths end in a 12-digit ID that is shared by all titles of a
// language region, e.g. `/some-slug-283418639546`. Legacy prefixes such as
// `/story/` or section paths are redirected server-side, so they are accepted too.
const TAMEDIA_ARTICLE_ID = /-(\d{12})\/?$/;

export const PUBLISHER_GROUPS: readonly PublisherGroup[] = [
  {
    id: 'tamedia-de',
    name: 'Tamedia (Deutschschweiz)',
    articleIdPattern: TAMEDIA_ARTICLE_ID,
    buildUrl: swapHost,
    titles: [
      {
        id: 'tagesanzeiger',
        name: 'Tages-Anzeiger',
        domain: 'www.tagesanzeiger.ch',
        language: 'de',
      },
      { id: 'bazonline', name: 'Basler Zeitung', domain: 'www.bazonline.ch', language: 'de' },
      {
        id: 'bernerzeitung',
        name: 'Berner Zeitung',
        domain: 'www.bernerzeitung.ch',
        language: 'de',
      },
      { id: 'derbund', name: 'Der Bund', domain: 'www.derbund.ch', language: 'de' },
    ],
  },
  {
    id: 'tamedia-fr',
    name: 'Tamedia (Suisse romande)',
    articleIdPattern: TAMEDIA_ARTICLE_ID,
    buildUrl: swapHost,
    titles: [
      { id: '24heures', name: '24 heures', domain: 'www.24heures.ch', language: 'fr' },
      { id: 'tdg', name: 'Tribune de Genève', domain: 'www.tdg.ch', language: 'fr' },
    ],
  },
];

/** All hostnames the extension is active on. */
export function allDomains(groups: readonly PublisherGroup[] = PUBLISHER_GROUPS): string[] {
  return groups.flatMap((group) => group.titles.map((title) => title.domain));
}

/** Match patterns for content scripts and host permissions. */
export function matchPatterns(groups: readonly PublisherGroup[] = PUBLISHER_GROUPS): string[] {
  return allDomains(groups).map((domain) => `https://${domain}/*`);
}
