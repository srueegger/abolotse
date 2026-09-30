import type { ExistsResult } from './core/exists';
import type { SkipReason } from './core/redirect';

/** Content script -> background. */
export type BackgroundRequest = { type: 'check'; url: string } | { type: 'stay'; url: string };

/** Popup -> content script. */
export type ContentRequest = { type: 'status' };

/** What Abo-Lotse knows about the page in a tab. Shown in the popup. */
export type PageStatus =
  | { kind: 'checking' }
  | {
      kind: 'skip';
      reason: SkipReason;
      titleName?: string;
      groupName?: string;
    }
  | {
      kind: 'result';
      result: ExistsResult;
      targetName: string;
      targetUrl: string;
      stayed: boolean;
      countdown: number;
      /** Show the "not available" notice (first time this session only). */
      notice: boolean;
    };
