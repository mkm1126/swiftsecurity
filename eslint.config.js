import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores (build output, etc.)
  { ignores: ['dist'] },

  // Default rules for all TS/TSX files
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // React hooks & refresh
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // 🚧 Guard: discourage hard-coded "/requests/..." strings
      // Literal strings like "/requests/123/RequestDetailsPage"
      // and template literals like `/requests/${id}/SelectRolesPage`
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/^\\/requests\\//]',
          message: 'Use ./lib/routes helpers instead of hard-coded paths.',
        },
        {
          selector: 'TemplateLiteral > TemplateElement[value.raw=/^\\/requests\\//]',
          message: 'Use ./lib/routes helpers instead of hard-coded paths.',
        },
      ],
    },
  },

  // Allow literals in the central route helpers
  {
    files: ['lib/routes.ts'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  }
);
