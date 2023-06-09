import dts from "rollup-plugin-dts";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
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
