import { describe, expect, it } from 'vitest';
import { extractArticleId, findTitleByHost, matchArticle } from '../src/core/match';
import { PUBLISHER_GROUPS } from '../src/publishers';

const ID = '283418639546';
const de = PUBLISHER_GROUPS.find((g) => g.id === 'tamedia-de')!;
const CH_ID = '4249333';
const chmedia = PUBLISHER_GROUPS.find((g) => g.id === 'chmedia')!;

describe('extractArticleId', () => {
  it.each([
    [`/andy-burnham-labour-stellt-thatchers-erbe-infrage-${ID}`, ID],
    [`/story/andy-burnham-${ID}`, ID],
    [`/ausland/europa/andy-burnham-${ID}`, ID],
    [`/andy-burnham-${ID}/`, ID],
  ])('extracts the ID from %s', (path, expected) => {
    expect(extractArticleId(de, path)).toBe(expected);
  });

  it.each([
    '/',
    '/zuerich',
    `/${ID}`, // no slug separator: not a regular article link
    '/some-slug-12345678901', // 11 digits
    '/some-slug-1234567890123', // 13 digits
    `/some-slug-${ID}/comments`,
  ])('rejects %s', (path) => {
    expect(extractArticleId(de, path)).toBeUndefined();
  });
});

describe('extractArticleId (CH Media)', () => {
  it.each([
    [`/basel/baselland/denkmalgeschuetzt-und-sanierungsbeduerftig-ld.${CH_ID}`, CH_ID],
    [`/-ld.${CH_ID}`, CH_ID], // short form
    [`/schweiz/slug-ld.${CH_ID}/`, CH_ID],
  ])('extracts the ID from %s', (path, expected) => {
    expect(extractArticleId(chmedia, path)).toBe(expected);
  });

  it.each([
    '/',
    '/basel',
    `/slug-${CH_ID}`, // no `ld.` marker
    '/slug-ld.', // no digits
    `/slug-ld.${CH_ID}/comments`,
  ])('rejects %s', (path) => {
    expect(extractArticleId(chmedia, path)).toBeUndefined();
  });
});

describe('findTitleByHost', () => {
  it('finds titles case-insensitively', () => {
    expect(findTitleByHost('WWW.BAZONLINE.CH')?.title.id).toBe('bazonline');
    expect(findTitleByHost('www.tdg.ch')?.group.id).toBe('tamedia-fr');
  });

  it('ignores unknown hosts and bare domains', () => {
    expect(findTitleByHost('bazonline.ch')).toBeUndefined();
    expect(findTitleByHost('www.example.ch')).toBeUndefined();
  });
});

describe('matchArticle', () => {
  it('matches articles on configured titles', () => {
    const match = matchArticle(new URL(`https://www.derbund.ch/slug-${ID}?x=1#top`));
    expect(match).toMatchObject({
      articleId: ID,
      title: { id: 'derbund' },
      group: { id: 'tamedia-de' },
    });
  });

  it('matches CH Media articles', () => {
    const match = matchArticle(
      new URL(`https://www.bzbasel.ch/basel/slug-ld.${CH_ID}?nativeApp=false`),
    );
    expect(match).toMatchObject({
      articleId: CH_ID,
      title: { id: 'bzbasel' },
      group: { id: 'chmedia' },
    });
  });

  it('ignores the homepage, other hosts and plain http', () => {
    expect(matchArticle(new URL('https://www.derbund.ch/'))).toBeUndefined();
    expect(matchArticle(new URL(`https://www.example.ch/slug-${ID}`))).toBeUndefined();
    expect(matchArticle(new URL(`http://www.derbund.ch/slug-${ID}`))).toBeUndefined();
  });
});
