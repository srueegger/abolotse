import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings } from '../src/core/settings';

describe('normalizeSettings', () => {
  it('returns defaults for garbage', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('x')).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps and rounds the countdown', () => {
    expect(normalizeSettings({ countdown: 9 }).countdown).toBe(5);
    expect(normalizeSettings({ countdown: -1 }).countdown).toBe(0);
    expect(normalizeSettings({ countdown: 2.6 }).countdown).toBe(3);
    expect(normalizeSettings({ countdown: 'x' }).countdown).toBe(3);
  });

  it('keeps only known groups and titles, one title per group', () => {
    const result = normalizeSettings({
      ownTitles: { 'tamedia-de': 'bazonline', 'tamedia-fr': 'bazonline', unknown: 'x' },
      excludedSources: ['tdg', 'tdg', 'nope', 3],
    });
    expect(result.ownTitles).toEqual({ 'tamedia-de': 'bazonline' });
    expect(result.excludedSources).toEqual(['tdg']);
  });
});
