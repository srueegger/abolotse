import { browser } from 'wxt/browser';
import { applyI18n, t } from '../../i18n';
import type { ContentRequest, PageStatus } from '../../messages';
import { loadSettings, saveSettings } from '../../settings';

const statusBox = document.getElementById('status')!;
const statusText = document.getElementById('status-text')!;
const openButton = document.getElementById('open-target') as HTMLButtonElement;
const enabled = document.getElementById('enabled') as HTMLInputElement;

applyI18n();

document.getElementById('settings')!.addEventListener('click', (event) => {
  event.preventDefault();
  void browser.runtime.openOptionsPage().then(() => window.close());
});

enabled.addEventListener('change', async () => {
  await saveSettings({ enabled: enabled.checked });
  void refresh();
});

void loadSettings().then((settings) => (enabled.checked = settings.enabled));
void refresh();

async function refresh() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let status: PageStatus | undefined;
  if (tab?.id !== undefined) {
    try {
      const request: ContentRequest = { type: 'status' };
      status = (await browser.tabs.sendMessage(tab.id, request)) as PageStatus;
    } catch {
      // No content script in this tab: not a supported site.
    }
  }
  render(status, tab?.id);
  // The check may still be running when the popup opens.
  if (status?.kind === 'checking') window.setTimeout(() => void refresh(), 300);
}

function render(status: PageStatus | undefined, tabId: number | undefined) {
  openButton.hidden = true;
  statusBox.dataset.tone = '';
  statusText.textContent = describe(status);

  if (status?.kind === 'result' && status.result === 'exists' && tabId !== undefined) {
    statusBox.dataset.tone = 'ok';
    openButton.hidden = false;
    openButton.textContent = t('popupOpenAt', status.targetName);
    const { targetUrl } = status;
    openButton.onclick = () => {
      void browser.tabs.update(tabId, { url: targetUrl }).then(() => window.close());
    };
  }
}

function describe(status: PageStatus | undefined): string {
  if (!status) return t('popupUnsupported');
  switch (status.kind) {
    case 'checking':
      return t('popupChecking');
    case 'result':
      if (status.result === 'exists') {
        return status.stayed
          ? `${t('popupAvailable', status.targetName)}. ${t('popupStayed')}`
          : t('popupAvailable', status.targetName);
      }
      return status.result === 'missing'
        ? t('popupMissing', status.targetName)
        : t('popupUnknown', status.targetName);
    case 'skip':
      switch (status.reason) {
        case 'disabled':
          return t('popupDisabled');
        case 'not-article':
          return t('popupNoArticle');
        case 'no-own-title':
          return t('popupNoOwnTitle', status.groupName ?? '');
        case 'own-title':
          return t('popupOwnTitle', status.titleName ?? '');
        case 'excluded-source':
          return t('popupExcluded');
      }
  }
}
