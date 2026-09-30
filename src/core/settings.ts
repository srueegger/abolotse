import { PUBLISHER_GROUPS, type PublisherGroup } from '../publishers';

export const SETTINGS_VERSION = 1;
export const MIN_COUNTDOWN = 0;
export const MAX_COUNTDOWN = 5;

export interface Settings {
  v: number;
  enabled: boolean;
  /** Seconds before redirecting. 0 redirects immediately without overlay. */
  countdown: number;
  /** Own (subscribed) title per publisher group: groupId -> titleId. */
  ownTitles: Record<string, string>;
  /** Source titles (by title ID) that never trigger a redirect. */
  excludedSources: string[];
}

export const DEFAULT_SETTINGS: Readonly<Settings> = {
  v: SETTINGS_VERSION,
  enabled: true,
  countdown: 3,
  ownTitles: {},
  excludedSources: [],
};

/**
 * Turns whatever is found in storage into valid settings. Unknown groups or
 * titles (e.g. after a publisher was removed) are dropped silently.
 */
export function normalizeSettings(
  raw: unknown,
  groups: readonly PublisherGroup[] = PUBLISHER_GROUPS,
): Settings {
  const input = (typeof raw === 'object' && raw !== null ? raw : {}) as Partial<Settings>;

  const countdown = Number.isFinite(input.countdown)
    ? Math.min(MAX_COUNTDOWN, Math.max(MIN_COUNTDOWN, Math.round(input.countdown as number)))
    : DEFAULT_SETTINGS.countdown;

  const ownTitles: Record<string, string> = {};
  if (typeof input.ownTitles === 'object' && input.ownTitles !== null) {
    for (const group of groups) {
      const titleId = (input.ownTitles as Record<string, unknown>)[group.id];
      if (typeof titleId === 'string' && group.titles.some((t) => t.id === titleId)) {
        ownTitles[group.id] = titleId;
      }
    }
  }

  const knownTitles = new Set(groups.flatMap((g) => g.titles.map((t) => t.id)));
  const excludedSources = Array.isArray(input.excludedSources)
    ? [
        ...new Set(
          input.excludedSources.filter((id) => typeof id === 'string' && knownTitles.has(id)),
        ),
      ]
    : [];

  return {
    v: SETTINGS_VERSION,
    enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_SETTINGS.enabled,
    countdown,
    ownTitles,
    excludedSources,
  };
}
