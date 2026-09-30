import { describe, expect, it } from 'vitest';
import { buildTargetUrl, stripTracking } from '../src/core/url';
import { PUBLISHER_GROUPS } from '../src/publishers';

describe('stripTracking', () => {
  it('removes tracking parameters and keeps the rest', () => {
    const url = new URL(
      'https://www.tdg.ch/a-123456789012?utm_source=fb&UTM_Medium=x&fbclid=1&gclid=2&page=2&mc_eid=3#comments',
    );
    expect(stripTracking(url).href).toBe('https://www.tdg.ch/a-123456789012?page=2#comments');
  });

  it('drops the empty query entirely', () => {
    const url = new URL('https://www.tdg.ch/a-123456789012?utm_campaign=x#top');
    expect(stripTracking(url).href).toBe('https://www.tdg.ch/a-123456789012#top');
  });

  it('does not mutate its input', () => {
    const url = new URL('https://www.tdg.ch/a?fbclid=1');
    stripTracking(url);
    expect(url.search).toBe('?fbclid=1');
  });
});

describe('buildTargetUrl', () => {
  it('swaps the host within a group and cleans the query', () => {
    const group = PUBLISHER_GROUPS.find((g) => g.id === 'tamedia-de')!;
    const target = group.titles.find((t) => t.id === 'bazonline')!;
    const source = new URL('https://www.tagesanzeiger.ch/slug-123456789012?fbclid=x&a=b#c');
    expect(buildTargetUrl(group, target, source)).toBe(
      'https://www.bazonline.ch/slug-123456789012?a=b#c',
    );
  });
});
