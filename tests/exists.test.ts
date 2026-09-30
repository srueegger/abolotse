import { describe, expect, it, vi } from 'vitest';
import { checkArticleExists, metaUrls, type FetchFn } from '../src/core/exists';
import { PUBLISHER_GROUPS } from '../src/publishers';

const group = PUBLISHER_GROUPS[0]!;
const ID = '283418639546';
const TARGET = `https://www.bazonline.ch/slug-${ID}`;

function response(status: number, url: string, body = ''): Response {
  const res = new Response(status === 204 ? null : body, { status });
  Object.defineProperty(res, 'url', { value: url });
  return res;
}

const run = (fetchFn: FetchFn, timeoutMs?: number) =>
  checkArticleExists({ group, targetUrl: TARGET, articleId: ID, fetchFn, timeoutMs });

describe('checkArticleExists', () => {
  it('exists on 200 with same host and ID (after slug canonicalisation)', async () => {
    const fetchFn = vi
      .fn<FetchFn>()
      .mockResolvedValue(response(200, `https://www.bazonline.ch/canonical-slug-${ID}`));
    await expect(run(fetchFn)).resolves.toBe('exists');
    expect(fetchFn).toHaveBeenCalledWith(
      TARGET,
      expect.objectContaining({ method: 'HEAD', credentials: 'include' }),
    );
  });

  it('is missing on 404', async () => {
    await expect(run(async () => response(404, TARGET))).resolves.toBe('missing');
  });

  it('is missing when bounced to a section page (soft 404)', async () => {
    await expect(run(async () => response(200, 'https://www.bazonline.ch/basel'))).resolves.toBe(
      'missing',
    );
  });

  it('is missing when bounced to another host', async () => {
    await expect(
      run(async () => response(200, `https://www.tagesanzeiger.ch/slug-${ID}`)),
    ).resolves.toBe('missing');
  });

  it('is unknown on server errors, network errors and redirect loops', async () => {
    await expect(run(async () => response(503, TARGET))).resolves.toBe('unknown');
    await expect(run(() => Promise.reject(new TypeError('Failed to fetch')))).resolves.toBe(
      'unknown',
    );
  });

  it('is unknown on timeout', async () => {
    const hang: FetchFn = (_url, init) =>
      new Promise((_resolve, reject) =>
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
      );
    await expect(run(hang, 20)).resolves.toBe('unknown');
  });

  it('falls back to GET and reads og:url when HEAD is not allowed', async () => {
    const html = `<meta property="og:url" content="https://www.tagesanzeiger.ch/slug-${ID}">`;
    const fetchFn = vi
      .fn<FetchFn>()
      .mockResolvedValueOnce(response(405, TARGET))
      .mockResolvedValueOnce(response(200, 'https://www.bazonline.ch/amp/article', html));
    await expect(run(fetchFn)).resolves.toBe('exists');
    expect(fetchFn).toHaveBeenLastCalledWith(TARGET, expect.objectContaining({ method: 'GET' }));
  });
});

describe('metaUrls', () => {
  it('finds og:url and canonical in any attribute order', () => {
    const html = `
      <link href="https://a.ch/x-1" rel="canonical">
      <meta content='https://b.ch/y-2' property='og:url' />
      <meta property="og:title" content="nope">`;
    expect(metaUrls(html)).toEqual(['https://a.ch/x-1', 'https://b.ch/y-2']);
  });
});
