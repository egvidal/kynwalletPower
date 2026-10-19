import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const layer = (patterns, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: patterns, message }] }],
});

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'node_modules',
      '.specify',
      '.claude',
      'specs',
      'test-results',
      'playwright-report',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'no-console': 'error',
    },
  },
  // Único adaptador autorizado a escribir en la consola (research.md R14)
  {
    files: ['src/infrastructure/ConsoleJsonLogger.ts'],
    rules: { 'no-console': 'off' },
  },
  // Regla de dependencias de Clean Architecture (Constitución 3.2, 3.5)
  {
    files: ['src/domain/**'],
    rules: layer(
      ['react', 'react-dom', '@/application/*', '@/infrastructure/*', '@/ui/*'],
      'El dominio no depende de frameworks ni de capas externas.',
    ),
  },
  {
    files: ['src/application/**'],
    rules: layer(
      ['react', 'react-dom', '@/infrastructure/*', '@/ui/*'],
      'La capa de aplicación solo depende del dominio.',
    ),
  },
  {
    files: ['src/ui/**'],
    rules: layer(['@/infrastructure/*'], 'La UI no depende de la infraestructura.'),
  },
);
