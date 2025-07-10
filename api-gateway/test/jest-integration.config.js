const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../tsconfig.json');

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '../',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage-integration',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths || {}, {
    prefix: '<rootDir>/',
  }),
  
  // Integration test specific settings
  testMatch: ['**/test/integration/**/*.spec.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/integration/setup.ts'],
  testTimeout: 30000, // 30 seconds for integration tests
  maxWorkers: 1, // Run integration tests sequentially
  forceExit: true, // Force exit after tests complete
  detectOpenHandles: true, // Detect handles that prevent Jest from exiting
  
  // Coverage settings for integration tests
  collectCoverage: true,
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};