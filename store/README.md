# Store listings

Texts for the Chrome Web Store and addons.mozilla.org (AMO) in English, German,
French and Italian. They are not part of the extension package.

Rules for all texts:

- Abo-Lotse never bypasses anything. It only leads to articles covered by the
  user's own subscription. Do not use the word "paywall" in names, summaries or
  prominent places.
- Do not use logos, colours or trademarks of the publishers in screenshots or
  promotional images. Title names are only used to describe compatibility.
- German texts use Swiss spelling (no «ß»).

## Common form fields

| Field              | Value                                                      |
| ------------------ | ---------------------------------------------------------- |
| Category (Chrome)  | Productivity (alternatively: News & Weather)               |
| Categories (AMO)   | Feeds, News & Blogging                                     |
| Homepage URL       | https://github.com/srueegger/abolotse                      |
| Support URL        | https://github.com/srueegger/abolotse/issues               |
| Privacy policy URL | https://github.com/srueegger/abolotse/blob/main/PRIVACY.md |
| License (AMO)      | GNU General Public License v2.0 only                       |
| Default language   | English                                                    |

## Screenshots

`screenshots/<lang>/` contains four 1280 × 800 images per language, suitable for
both stores:

1. `1-redirect.png`: the notice before redirecting
2. `2-not-available.png`: the notice when an article is not available
3. `3-settings.png`: welcome and settings page
4. `4-popup.png`: popup with the status for the current tab

The article page in the screenshots is a neutral placeholder without any
publisher branding; the extension UI is real. AMO uses one set of images for all
languages (only captions are translated), so upload the German set there. The
Chrome Web Store accepts screenshots per language.

## Chrome Web Store: privacy practices

**Single purpose:** When the user opens an article on a Swiss newspaper website,
check whether the same article is available on the newspaper the user subscribes
to and take the user there.

**Permission justifications**

- `storage`: stores the user's settings (chosen newspaper, countdown, excluded
  websites, on/off) and, for the current session only, check results and
  "stay here" choices.
- Host permissions (newspaper websites): the content script detects article pages
  on these websites, and the background checks with one request whether the same
  article exists on the user's newspaper. No other websites are accessed.

**Remote code:** No, the extension does not use remote code.

**Data usage:** The extension does not collect or use any of the listed data
types. Certify all three statements (no sale, no unrelated use, no
creditworthiness use).

## AMO

- `data_collection_permissions` in the manifest: `required: ["none"]`.
- Upload `abolotse-<version>-firefox.zip` and, when asked for source code,
  `abolotse-<version>-sources.zip`. Build instructions for reviewers are in the
  main README ("Build instructions for addons.mozilla.org reviewers").
- Notes to reviewer: "The extension sends HEAD requests (GET as fallback) with
  credentials to the configured newspaper websites only, to check whether an
  article exists. Credentials are required because these websites answer a
  cookie-less first request with a 302 to themselves that sets a cookie."
