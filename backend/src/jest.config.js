/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {},
  collectCoverageFrom: [
    'application/**/*.ts',
    'domain/**/*.ts',
    'adapters/**/*.ts',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  testTimeout: 15000,
 
  setupFiles: ['<rootDir>/__tests__/setup.ts'],
};