import base from "./lib/eslint-config/index.js";

export default [
  ...base,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "packages/website/**",
      "worktrees/**",
      "plans/**",
    ],
  },
];
