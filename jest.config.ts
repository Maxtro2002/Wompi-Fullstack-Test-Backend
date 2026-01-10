import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^shared/(.*)$': '<rootDir>/src/shared/$1',
    '^domain/(.*)$': '<rootDir>/src/domain/$1',
    '^application/(.*)$': '<rootDir>/src/application/$1',
    '^infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
  },
  clearMocks: true,
  collectCoverage: false,
  collectCoverageFrom: [
    'src/application/use-cases/**/*.ts',
    'src/shared/result.ts'
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
  },
};

export default config;
