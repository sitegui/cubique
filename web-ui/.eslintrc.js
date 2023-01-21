module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    'plugin:vue/essential',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'vue'
  ],
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
