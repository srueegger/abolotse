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

// CH Media article paths end in `-ld.` plus a numeric ID that is shared by all
// titles, e.g. `/schweiz/some-slug-ld.4250286`. The short form `/-ld.4250286`
// works too.
const CH_MEDIA_ARTICLE_ID = /-ld\.(\d+)\/?$/;

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
  {
    id: 'chmedia',
    name: 'CH Media',
    articleIdPattern: CH_MEDIA_ARTICLE_ID,
    buildUrl: swapHost,
    titles: [
      {
        id: 'aargauerzeitung',
        name: 'Aargauer Zeitung',
        domain: 'www.aargauerzeitung.ch',
        language: 'de',
      },
      {
        id: 'appenzellerzeitung',
        name: 'Appenzeller Zeitung',
        domain: 'www.appenzellerzeitung.ch',
        language: 'de',
      },
      {
        id: 'badenertagblatt',
        name: 'Badener Tagblatt',
        domain: 'www.badenertagblatt.ch',
        language: 'de',
      },
      { id: 'bzbasel', name: 'bz Basel', domain: 'www.bzbasel.ch', language: 'de' },
      {
        id: 'grenchnertagblatt',
        name: 'Grenchner Tagblatt',
        domain: 'www.grenchnertagblatt.ch',
        language: 'de',
      },
      {
        id: 'limmattalerzeitung',
        name: 'Limmattaler Zeitung',
        domain: 'www.limmattalerzeitung.ch',
        language: 'de',
      },
      {
        id: 'luzernerzeitung',
        name: 'Luzerner Zeitung',
        domain: 'www.luzernerzeitung.ch',
        language: 'de',
      },
      {
        id: 'nidwaldnerzeitung',
        name: 'Nidwaldner Zeitung',
        domain: 'www.nidwaldnerzeitung.ch',
        language: 'de',
      },
      {
        id: 'obwaldnerzeitung',
        name: 'Obwaldner Zeitung',
        domain: 'www.obwaldnerzeitung.ch',
        language: 'de',
      },
      {
        id: 'oltnertagblatt',
        name: 'Oltner Tagblatt',
        domain: 'www.oltnertagblatt.ch',
        language: 'de',
      },
      { id: 'schweizheute', name: 'Schweiz Heute', domain: 'www.schweizheute.ch', language: 'de' },
      {
        id: 'solothurnerzeitung',
        name: 'Solothurner Zeitung',
        domain: 'www.solothurnerzeitung.ch',
        language: 'de',
      },
      { id: 'tagblatt', name: 'St. Galler Tagblatt', domain: 'www.tagblatt.ch', language: 'de' },
      {
        id: 'thurgauerzeitung',
        name: 'Thurgauer Zeitung',
        domain: 'www.thurgauerzeitung.ch',
        language: 'de',
      },
      { id: 'urnerzeitung', name: 'Urner Zeitung', domain: 'www.urnerzeitung.ch', language: 'de' },
      {
        id: 'zofingertagblatt',
        name: 'Zofinger Tagblatt',
        domain: 'www.zofingertagblatt.ch',
        language: 'de',
      },
      { id: 'zugerzeitung', name: 'Zuger Zeitung', domain: 'www.zugerzeitung.ch', language: 'de' },
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
