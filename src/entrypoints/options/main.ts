import { browser } from 'wxt/browser';
import type { Settings } from '../../core/settings';
import { applyI18n, t } from '../../i18n';
import { PUBLISHER_GROUPS, matchPatterns } from '../../publishers';
import { loadSettings, onSettingsChanged, saveSettings } from '../../settings';

const isWelcome = new URLSearchParams(location.search).has('welcome');
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

applyI18n();
const heading = isWelcome ? t('welcomeHeading') : t('optionsPageTitle');
$('page-heading').textContent = heading;
document.title = heading;
$('welcome').hidden = !isWelcome;

renderOwnTitles();
renderExcluded();
void loadSettings().then(render);
onSettingsChanged(render);
void checkPermissions();

function renderOwnTitles() {
  const container = $('own-titles');
  for (const group of PUBLISHER_GROUPS) {
    const fieldset = el('fieldset');
    fieldset.append(el('legend', group.name));
    const choices = el('div', undefined, 'choices');
    const options = [{ id: '', name: t('optionsNone') }, ...group.titles];
    for (const option of options) {
      const input = el('input');
      input.type = 'radio';
      input.name = `own-${group.id}`;
      input.value = option.id;
      input.addEventListener('change', async () => {
        const { ownTitles } = await loadSettings();
        const next = { ...ownTitles };
        if (option.id) next[group.id] = option.id;
        else delete next[group.id];
        await save({ ownTitles: next });
      });
      choices.append(labelled(input, option.name));
    }
    fieldset.append(choices);
    container.append(fieldset);
  }
}

function renderExcluded() {
  const container = $('excluded');
  for (const group of PUBLISHER_GROUPS) {
    const fieldset = el('fieldset');
    fieldset.append(el('legend', group.name));
    const choices = el('div', undefined, 'choices');
    for (const title of group.titles) {
      const input = el('input');
      input.type = 'checkbox';
      input.value = title.id;
      input.dataset.group = group.id;
      input.addEventListener('change', async () => {
        const { excludedSources } = await loadSettings();
        const next = new Set(excludedSources);
        if (input.checked) next.add(title.id);
        else next.delete(title.id);
        await save({ excludedSources: [...next] });
      });
      choices.append(labelled(input, title.name));
    }
    fieldset.append(choices);
    container.append(fieldset);
  }
}

$<HTMLInputElement>('enabled').addEventListener('change', (event) => {
  void save({ enabled: (event.target as HTMLInputElement).checked });
});

$<HTMLInputElement>('notify-missing').addEventListener('change', (event) => {
  void save({ notifyMissing: (event.target as HTMLInputElement).checked });
});

const countdown = $<HTMLInputElement>('countdown');
countdown.addEventListener('input', () => renderCountdown(Number(countdown.value)));
countdown.addEventListener('change', () => void save({ countdown: Number(countdown.value) }));

function render(settings: Settings) {
  for (const group of PUBLISHER_GROUPS) {
    const selected = settings.ownTitles[group.id] ?? '';
    for (const input of document.querySelectorAll<HTMLInputElement>(
      `input[name="own-${group.id}"]`,
    )) {
      input.checked = input.value === selected;
    }
  }

  for (const input of document.querySelectorAll<HTMLInputElement>('#excluded input')) {
    const isOwn = settings.ownTitles[input.dataset.group ?? ''] === input.value;
    // The own title never redirects anyway, so excluding it has no meaning.
    input.disabled = isOwn;
    input.checked = !isOwn && settings.excludedSources.includes(input.value);
    const marker = input.parentElement?.querySelector('.marker');
    if (marker) marker.textContent = isOwn ? ` (${t('optionsOwnTitleMarker')})` : '';
  }

  $<HTMLInputElement>('enabled').checked = settings.enabled;
  $<HTMLInputElement>('notify-missing').checked = settings.notifyMissing;
  countdown.value = String(settings.countdown);
  renderCountdown(settings.countdown);
  $('welcome-done').hidden = !isWelcome || Object.keys(settings.ownTitles).length === 0;
}

function renderCountdown(seconds: number) {
  const text =
    seconds === 0
      ? t('optionsCountdownZero')
      : seconds === 1
        ? t('optionsCountdownOne')
        : t('optionsCountdownOther', String(seconds));
  $('countdown-value').textContent = text;
  countdown.setAttribute('aria-valuetext', text);
}

let savedTimer: number | undefined;
async function save(patch: Partial<Settings>) {
  await saveSettings(patch);
  const saved = $('saved');
  saved.textContent = t('optionsSaved');
  window.clearTimeout(savedTimer);
  savedTimer = window.setTimeout(() => (saved.textContent = ''), 2000);
}

// Firefox lets users revoke host permissions; without them nothing works.
async function checkPermissions() {
  const origins = matchPatterns();
  const banner = $('permissions');
  const update = async () => {
    banner.hidden = await browser.permissions.contains({ origins });
  };
  $('grant').addEventListener('click', async () => {
    await browser.permissions.request({ origins });
    await update();
  });
  await update();
}

function labelled(input: HTMLInputElement, text: string): HTMLLabelElement {
  const label = el('label', undefined, 'row');
  const span = el('span', text);
  span.append(el('span', undefined, 'marker'));
  label.append(input, span);
  return label;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
