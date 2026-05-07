// @ts-check
const nextPlugin = require('eslint-config-next');
const base = require('./base');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...base,
  ...nextPlugin,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
];
