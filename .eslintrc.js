module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  ignorePatterns: [".eslintrc.js", "jest.config.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    // "@typescript-eslint/sort-type-constituents": "error",
    "@typescript-eslint/prefer-ts-expect-error": "error",
    "sort-imports": [
      "error",
      {
        allowSeparatedGroups: true,
      },
    ],
  },
};
