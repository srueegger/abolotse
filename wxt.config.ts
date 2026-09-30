import { defineConfig } from 'wxt';
import { matchPatterns } from './src/publishers';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'assets/icon.svg',
    sizes: [128, 96, 48, 32, 16],
  },
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    homepage_url: 'https://github.com/srueegger/abolotse',
    permissions: ['storage'],
    host_permissions: matchPatterns(),
    action: {
      default_title: '__MSG_extName__',
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'abolotse@rueegger.dev',
          strict_min_version: '140.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    }),
  }),
  zip: {
    artifactTemplate: '{{name}}-{{version}}-{{browser}}.zip',
    sourcesTemplate: '{{name}}-{{version}}-sources.zip',
    excludeSources: ['store/**', 'coverage/**', '.github/**'],
  },
});
