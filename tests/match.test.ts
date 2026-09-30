import { describe, expect, it } from 'vitest';
import { extractArticleId, findTitleByHost, matchArticle } from '../src/core/match';
import { PUBLISHER_GROUPS } from '../src/publishers';

const ID = '283418639546';
const de = PUBLISHER_GROUPS.find((g) => g.id === 'tamedia-de')!;

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

  it('ignores the homepage, other hosts and plain http', () => {
    expect(matchArticle(new URL('https://www.derbund.ch/'))).toBeUndefined();
    expect(matchArticle(new URL(`https://www.example.ch/slug-${ID}`))).toBeUndefined();
    expect(matchArticle(new URL(`http://www.derbund.ch/slug-${ID}`))).toBeUndefined();
  });
});
