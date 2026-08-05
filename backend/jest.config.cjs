module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setupEnv.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/server.ts',
    '!src/worker.ts',
    '!src/scripts/**',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      statements: 55,
      branches: 25,
      functions: 40,
      lines: 55,
    },
  },
  clearMocks: true,
};
