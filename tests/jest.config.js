/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",

  // Run both .js and .ts test files
  testMatch: ["**/*.test.js", "**/*.test.ts"],

  // 30 seconds per test — needed for HTTP + WS calls against a live server
  testTimeout: 30000,

  // When you add TypeScript test files later, ts-jest handles them
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { strict: false } }],
  },
};
