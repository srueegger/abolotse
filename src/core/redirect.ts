import { PUBLISHER_GROUPS, type PublisherGroup } from '../publishers';
import { findTitleById, matchArticle, type ArticleMatch, type TitleMatch } from './match';
import type { Settings } from './settings';
import { buildTargetUrl } from './url';

export type SkipReason =
  'disabled' | 'not-article' | 'no-own-title' | 'own-title' | 'excluded-source' | 'user-stayed';

export type Decision =
  | { action: 'skip'; reason: SkipReason; article?: ArticleMatch }
  | { action: 'check'; article: ArticleMatch; target: TitleMatch; targetUrl: string };

/**
 * Decides whether a page is a candidate for a redirect. Pure: the existence
 * check on the target title happens afterwards and only for `check` results.
 */
export function decideRedirect(
  url: URL,
  settings: Settings,
  stayedArticleIds: ReadonlySet<string>,
  groups: readonly PublisherGroup[] = PUBLISHER_GROUPS,
): Decision {
  const article = matchArticle(url, groups);
  if (!article) return { action: 'skip', reason: 'not-article' };
  if (!settings.enabled) return { action: 'skip', reason: 'disabled', article };

  const ownTitleId = settings.ownTitles[article.group.id];
  const target = ownTitleId ? findTitleById(article.group.id, ownTitleId, groups) : undefined;
  if (!target) return { action: 'skip', reason: 'no-own-title', article };

  // Loop guard: never lead away from the user's own title.
  if (target.title.id === article.title.id) return { action: 'skip', reason: 'own-title', article };

  if (settings.excludedSources.includes(article.title.id)) {
    return { action: 'skip', reason: 'excluded-source', article };
  }
  if (stayedArticleIds.has(stayKey(article))) {
    return { action: 'skip', reason: 'user-stayed', article };
  }

  return {
    action: 'check',
    article,
    target,
    targetUrl: buildTargetUrl(article.group, target.title, url),
  };
}

export function stayKey(article: Pick<ArticleMatch, 'group' | 'articleId'>): string {
  return `${article.group.id}:${article.articleId}`;
}
