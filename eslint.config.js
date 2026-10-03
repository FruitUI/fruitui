import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['build/', 'dist/', 'vendor/', 'node_modules/', 'test-results/', 'tests/host/.runtime/'] },
  js.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    files: ['scripts/**', 'tests/**', '*.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];
