import { describe, expect, it } from 'vitest';
import { PUBLISHER_GROUPS, allDomains, matchPatterns } from '../src/publishers';

describe('publisher config', () => {
  it('has unique group, title and domain identifiers', () => {
    const groupIds = PUBLISHER_GROUPS.map((g) => g.id);
    const titleIds = PUBLISHER_GROUPS.flatMap((g) => g.titles.map((t) => t.id));
    const domains = allDomains();
    expect(new Set(groupIds).size).toBe(groupIds.length);
    expect(new Set(titleIds).size).toBe(titleIds.length);
    expect(new Set(domains).size).toBe(domains.length);
  });

  it('uses plain lowercase hostnames', () => {
    for (const domain of allDomains()) {
      expect(domain).toMatch(/^[a-z0-9.-]+\.[a-z]{2,}$/);
    }
  });

  it('keeps DE and FR titles in separate groups', () => {
    for (const group of PUBLISHER_GROUPS) {
      expect(new Set(group.titles.map((t) => t.language)).size).toBe(1);
    }
  });

  it('builds https match patterns', () => {
    expect(matchPatterns()).toContain('https://www.bazonline.ch/*');
    expect(matchPatterns().every((p) => p.startsWith('https://'))).toBe(true);
  });
});
