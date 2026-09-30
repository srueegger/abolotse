# Abo-Lotse

A browser extension for Firefox and Chrome that takes you from an article on a
Swiss sister newspaper to the same article on the newspaper **you subscribe to**.

Swiss publishers publish the same article on several of their titles. If you
subscribe to the _Basler Zeitung_ and follow a link to the same story on
_tagesanzeiger.ch_, Abo-Lotse checks in the background whether the article is
available on _bazonline.ch_ and takes you there, so you can read it with your
own subscription.

Abo-Lotse does not unlock any content and does not bypass anything. It only
leads you to articles covered by a subscription you already have.

## Supported publishers

Redirects only happen within the same publisher group.

| Group                    | Titles                                                   |
| ------------------------ | -------------------------------------------------------- |
| Tamedia (Deutschschweiz) | Tages-Anzeiger, Basler Zeitung, Berner Zeitung, Der Bund |
| Tamedia (Suisse romande) | 24 heures, Tribune de Genève                             |

Former regional portals (e.g. Zürichsee-Zeitung, Landbote, Thuner Tagblatt) now
redirect to sections of the titles above and are covered through them.

## Features

- Choose one own newspaper per publisher group, on a welcome page after installation.
- A short notice with a countdown (0 to 5 seconds, 0 = redirect immediately) and
  the buttons "Read now" and "Stay here". The notice supports keyboard use,
  screen readers, reduced motion and dark mode.
- "Stay here" is remembered per article until the browser is closed.
- Tracking parameters (`utm_*`, `fbclid`, `gclid` …) are removed on redirect;
  other query parameters and the hash are kept.
- Never redirects away from your own newspaper, never across publisher groups,
  and never on network errors or timeouts (3 s).
- The popup shows the status for the current tab. A grey "–" badge means the
  article is not available at your newspaper.
- English, German, French and Italian.

## Privacy

No telemetry, no analytics, no external servers. The only network requests go to
the newspaper websites listed above. See [PRIVACY.md](PRIVACY.md).

Permissions: `storage` and host access to the newspaper websites above. Nothing else.

## Development

Requirements: Node.js 22 or newer (CI uses 24) and pnpm via Corepack.

```bash
corepack enable
pnpm install
pnpm dev            # Chrome with live reload
pnpm dev:firefox    # Firefox with live reload
pnpm test           # unit tests (Vitest)
pnpm lint           # ESLint and Prettier
pnpm compile        # type check
```

Built with [WXT](https://wxt.dev/), TypeScript and Manifest V3, without runtime
dependencies.

### Project layout

```
src/publishers.ts          publisher configuration (the only file to touch for a new publisher)
src/core/                  pure logic: matching, URL cleanup, redirect decision, existence check
src/entrypoints/           background, content script, popup, options/welcome page
src/overlay/               redirect notice (shadow DOM)
public/_locales/           translations
tests/                     unit tests
store/                     store listings (not part of the extension)
```

### Adding a publisher

1. Check how the publisher's article URLs are built and how its servers answer
   for missing articles (see the notes in `src/core/exists.ts`).
2. Add a `PublisherGroup` to `PUBLISHER_GROUPS` in `src/publishers.ts`: a stable
   `id`, a regular expression that extracts the shared article ID from the path,
   a `buildUrl` function (usually `swapHost`) and the list of titles.
3. Run `pnpm test` and `pnpm build`. Content script matches and host permissions
   are generated from the configuration.

Group and title IDs are stored in user settings and must not be renamed once released.

## Building for release

```bash
pnpm zip            # .output/abolotse-<version>-chrome.zip
pnpm zip:firefox    # .output/abolotse-<version>-firefox.zip and abolotse-<version>-sources.zip
```

### Build instructions for addons.mozilla.org reviewers

The sources ZIP contains everything needed to reproduce the Firefox build.

1. Install Node.js 24 (any version ≥ 22 works) on macOS, Linux or Windows.
2. In the unpacked source directory run:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   pnpm build:firefox
   ```

3. The extension is in `.output/firefox-mv3/`. It matches the submitted package.

The pnpm version is pinned in `package.json` (`packageManager`), all other
versions in `pnpm-lock.yaml`.

## Testing locally

**Firefox:** run `pnpm build:firefox`, open `about:debugging#/runtime/this-firefox`,
click "Load Temporary Add-on…" and select `.output/firefox-mv3/manifest.json`.

**Chrome:** run `pnpm build`, open `chrome://extensions`, enable "Developer mode",
click "Load unpacked" and select the folder `.output/chrome-mv3`.

## Feedback

Bugs, questions and ideas (for example a new publisher): please open an
[issue on GitHub](https://github.com/srueegger/abolotse/issues).

## License

Copyright © 2026 Samuel Rüegger <samuel@rueegger.me>

Licensed under the [GNU General Public License v2.0 only](LICENSE).

---

## Kurz auf Deutsch

Abo-Lotse ist eine Browsererweiterung für Firefox und Chrome. Sie wählen einmal
die Zeitung, die Sie abonniert haben, zum Beispiel die Basler Zeitung. Öffnen
Sie denselben Artikel bei einem Schwestertitel wie dem Tages-Anzeiger, prüft
Abo-Lotse im Hintergrund, ob der Artikel auch bei Ihrer Zeitung verfügbar ist,
und leitet Sie dorthin weiter. So lesen Sie ihn mit Ihrem eigenen Abo.

Abo-Lotse schaltet keine Inhalte frei. Die Erweiterung erhebt keine Daten und
kontaktiert nur die Websites der unterstützten Zeitungen. Unterstützt werden in
Version 1.0 die Titel von Tamedia in der Deutschschweiz und in der Romandie.
