import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type Messages = Record<string, { message: string; placeholders?: Record<string, unknown> }>;

const dir = join(__dirname, '../public/_locales');
const locales = Object.fromEntries(
  readdirSync(dir).map((lang) => [
    lang,
    JSON.parse(readFileSync(join(dir, lang, 'messages.json'), 'utf8')) as Messages,
  ]),
);
const reference = locales.en!;

describe('locales', () => {
  it('provides en, de, fr and it', () => {
    expect(Object.keys(locales).sort()).toEqual(['de', 'en', 'fr', 'it']);
  });

  it.each(Object.keys(locales))('%s has the same keys and placeholders as en', (lang) => {
    const messages = locales[lang]!;
    expect(Object.keys(messages).sort()).toEqual(Object.keys(reference).sort());
    for (const [key, { message }] of Object.entries(reference)) {
      const expected = message.match(/\$[A-Z]+\$/g)?.sort() ?? [];
      expect(messages[key]!.message.match(/\$[A-Z]+\$/g)?.sort() ?? [], key).toEqual(expected);
    }
  });

  it('uses Swiss spelling in German (no ß)', () => {
    for (const { message } of Object.values(locales.de!)) expect(message).not.toContain('ß');
  });

  it('never mentions paywalls', () => {
    for (const messages of Object.values(locales)) {
      for (const { message } of Object.values(messages)) expect(message).not.toMatch(/paywall/i);
    }
  });
});
