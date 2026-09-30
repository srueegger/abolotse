import { describe, expect, it } from 'vitest';
import { decideRedirect } from '../src/core/redirect';
import { DEFAULT_SETTINGS, type Settings } from '../src/core/settings';

const ARTICLE = 'https://www.tagesanzeiger.ch/slug-283418639546?utm_source=x';
const settings = (patch: Partial<Settings> = {}): Settings => ({
  ...DEFAULT_SETTINGS,
  ownTitles: { 'tamedia-de': 'bazonline' },
  ...patch,
});
const none = new Set<string>();

describe('decideRedirect', () => {
  it('checks a sister-title article against the own title', () => {
    const decision = decideRedirect(new URL(ARTICLE), settings(), none);
    expect(decision).toMatchObject({
      action: 'check',
      target: { title: { id: 'bazonline' } },
      targetUrl: 'https://www.bazonline.ch/slug-283418639546',
      stayed: false,
    });
  });

  it('never redirects away from the own title (loop guard)', () => {
    const url = new URL('https://www.bazonline.ch/slug-283418639546');
    expect(decideRedirect(url, settings(), none)).toMatchObject({
      action: 'skip',
      reason: 'own-title',
    });
  });

  it('never redirects across groups', () => {
    const url = new URL('https://www.tdg.ch/slug-283418639546');
    expect(decideRedirect(url, settings(), none)).toMatchObject({
      action: 'skip',
      reason: 'no-own-title',
    });
  });

  it('respects the global switch', () => {
    expect(decideRedirect(new URL(ARTICLE), settings({ enabled: false }), none)).toMatchObject({
      action: 'skip',
      reason: 'disabled',
    });
  });

  it('respects excluded sources', () => {
    const s = settings({ excludedSources: ['tagesanzeiger'] });
    expect(decideRedirect(new URL(ARTICLE), s, none)).toMatchObject({ reason: 'excluded-source' });
  });

  it('checks but flags articles the user chose to stay on', () => {
    const stayed = new Set(['tamedia-de:283418639546']);
    expect(decideRedirect(new URL(ARTICLE), settings(), stayed)).toMatchObject({
      action: 'check',
      stayed: true,
    });
  });

  it('skips non-article pages', () => {
    const url = new URL('https://www.tagesanzeiger.ch/zuerich');
    expect(decideRedirect(url, settings(), none)).toMatchObject({
      action: 'skip',
      reason: 'not-article',
    });
  });

  it('ignores an own title that no longer exists in the config', () => {
    const s = settings({ ownTitles: { 'tamedia-de': 'landbote' } });
    expect(decideRedirect(new URL(ARTICLE), s, none)).toMatchObject({ reason: 'no-own-title' });
  });
});
