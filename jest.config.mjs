import { pathsToModuleNameMapper } from "ts-jest";
import config from "./tsconfig.json" with { type: 'json' };
const { compilerOptions } = config;

/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["**/*.test.ts"],
  // // coverage
  // collectCoverage: true,
  // coverageDirectory: "__tests__/coverage/",
  roots: ['<rootDir>'],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      // required due to custom location of tsconfig.json configuration file
      // https://kulshekhar.github.io/ts-jest/docs/getting-started/options/tsconfig
      { tsconfig: "tsconfig.json" },
    ],
  },
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths,{ prefix: '<rootDir>/' } )
};
