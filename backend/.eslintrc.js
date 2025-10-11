module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'consistent-return': 'off',
    'no-underscore-dangle': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'class-methods-use-this': 'off',
    'import/prefer-default-export': 'off',
    'no-param-reassign': ['error', { props: false }],
    'prefer-destructuring': ['error', { object: true, array: false }],
    'max-len': ['error', { code: 120, ignoreComments: true, ignoreStrings: true }],
  },
};
