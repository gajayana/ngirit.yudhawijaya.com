// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      'vue/html-self-closing': 'off',
      'vue/multi-word-component-names': 'off',
      // Catch undefined variables - helps prevent production errors
      'no-undef': 'error',
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  }
);
