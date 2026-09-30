import { PUBLISHER_GROUPS, type PublisherGroup, type PublisherTitle } from '../publishers';

export interface TitleMatch {
  group: PublisherGroup;
  title: PublisherTitle;
}

export interface ArticleMatch extends TitleMatch {
  articleId: string;
}

export function findTitleByHost(
  hostname: string,
  groups: readonly PublisherGroup[] = PUBLISHER_GROUPS,
): TitleMatch | undefined {
  const host = hostname.toLowerCase();
  for (const group of groups) {
    const title = group.titles.find((t) => t.domain === host);
    if (title) return { group, title };
  }
  return undefined;
}

export function findTitleById(
  groupId: string,
  titleId: string,
  groups: readonly PublisherGroup[] = PUBLISHER_GROUPS,
): TitleMatch | undefined {
  const group = groups.find((g) => g.id === groupId);
  const title = group?.titles.find((t) => t.id === titleId);
  return group && title ? { group, title } : undefined;
}

export function extractArticleId(group: PublisherGroup, pathname: string): string | undefined {
  return group.articleIdPattern.exec(pathname)?.[1];
}

/** Returns the article on a configured title, or undefined for any other page. */
export function matchArticle(
  url: URL,
  groups: readonly PublisherGroup[] = PUBLISHER_GROUPS,
): ArticleMatch | undefined {
  if (url.protocol !== 'https:') return undefined;
  const match = findTitleByHost(url.hostname, groups);
  if (!match) return undefined;
  const articleId = extractArticleId(match.group, url.pathname);
  return articleId ? { ...match, articleId } : undefined;
}
