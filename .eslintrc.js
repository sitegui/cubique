module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
  },
  overrides: [{
    files: 'test/*.mjs',
    env: {
      node: true,
      mocha: true
    }
  }]
}
