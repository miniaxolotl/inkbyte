import typescript from "@rollup/plugin-typescript";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("./package.json");

export default [
  {
    input: "./src/server.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
      },
    ],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        exclude: [".rollup.cache/**/*", "./dist/index.d.ts", "./test/**/*"],
        outputToFilesystem: true,
      }),
    ],
  },
];
