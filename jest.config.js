/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json',
        stringifyContentPathRegex: '\\.html$',
      },
    ],
  },

  moduleNameMapper: {
    '^@ionic/angular(.*)$': '<rootDir>/__mocks__/ionic-angular.js',
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  transformIgnorePatterns: [
    'node_modules/(?!(@ionic|@angular|@capacitor|ionicons|primeng|@primeuix|rxjs|tslib))',
  ],

  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
    '!src/test.ts',
    '!src/environments/**',
  ],
  coverageDirectory: 'coverage/jest',
  coverageReporters: ['html', 'lcov', 'text-summary'],
};
