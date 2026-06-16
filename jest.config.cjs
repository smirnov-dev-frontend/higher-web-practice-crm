/** @type {import('jest').Config} */
module.exports = {
   testEnvironment: 'jest-environment-jsdom',
   setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
   transform: {
      '^.+\\.tsx?$': ['ts-jest', {
         tsconfig: './tsconfig.jest.json',
      }],
   },
   moduleNameMapper: {
      '\\.svg\\?react$': '<rootDir>/src/test/__mocks__/svgMock.tsx',
      '\\.svg$': '<rootDir>/src/test/__mocks__/svgUrlMock.ts',
      '\\.(css|less|scss)$': 'identity-obj-proxy',
   },
   testMatch: ['**/*.test.ts', '**/*.test.tsx'],
}
