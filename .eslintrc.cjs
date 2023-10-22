module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  ignorePatterns: ["/*", "!/src"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["prettier", "@typescript-eslint", "simple-import-sort"],
  rules: {
    // Prettier conflict resolution
    "prettier/prettier": "error",
    // Sort imports + exports using a consistent format
    "simple-import-sort/exports": "error",
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          ["^\\u0000"],
          ["^node:"],
          ["^@?\\w"],
          ["^"],
          ["^\\.\\."],
          ["^\\."],
        ],
      },
    ],
    // Allow only underscores to be unused
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_+$",
        varsIgnorePattern: "^_+$",
        caughtErrorsIgnorePattern: "^_+$",
      },
    ],
  },
};
