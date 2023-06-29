import dts from "rollup-plugin-dts";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const packageJson = require("./package.json");

export default [
  {
    input: "./src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        exclude: [".rollup.cache/**/*", "./dist/index.d.ts", "./test/**/*"],
        outputToFilesystem: false,
      }),
      terser({
        mangle: { toplevel: true },
        compress: {
          module: true,
          toplevel: true,
          unsafe_arrows: true,
        },
      }),
    ],
    external: [
      "valtio",
      "cross-fetch",
      "form-data",
      "date-fns",
      "cookie",
      "vite-plugin-ssr/client/router",
      "@mantine/notifications",
      "@lib/quikk",
      "@lib/utility",
      "@lib/config",
      "@lib/types",
    ],
  },
  {
    input: "./dist/esm/index.d.ts",
    output: [{ file: "./dist/index.d.ts", format: "esm" }],
    plugins: [nodeResolve({ preferBuiltins: true }), commonjs(), dts.default()],
  },
];
