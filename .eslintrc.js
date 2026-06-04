/**
 * @module .eslintrc
 * @description ESLint configuration.
 */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'react/react-in-jsx-scope': 0,
    'react/prop-types': 0,
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react/display-name': 0,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};