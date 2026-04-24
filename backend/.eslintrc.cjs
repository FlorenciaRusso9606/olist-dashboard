module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  rules: {
    
    'prettier/prettier': 'error',

   
    '@typescript-eslint/no-explicit-any': 'error',

   
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

 
    '@typescript-eslint/no-floating-promises': 'error',

    '@typescript-eslint/no-unsafe-assignment': 'warn',

    '@typescript-eslint/no-misused-promises': [
      'error',
      { checksVoidReturn: { attributes: false } },
    ],

    eqeqeq: ['error', 'always'],

    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'jest.config.js',
    '.eslintrc.js',
    'prisma/',
  ],
};