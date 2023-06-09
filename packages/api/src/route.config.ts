import KoaRouter from "koa-router";
import fs from "fs";

import { api_config } from "@lib/config";

export const versions = fs.readdirSync(`${__dirname}/controller/`);
const controller_regex = /((controller\.ts)|(controller\.js))$/;

export const base_router = new KoaRouter();

export const load_routes = async () => {
  for (const version of versions) {
    const version_router = new KoaRouter();
    try {
      const modules = fs
        .readdirSync(`${__dirname}/controller/${version}/`)
        .reduce(
          (a, x) => (x.match(controller_regex) ? [...a, x] : a),
          [] as string[],
        );
      for (const module of modules) {
        const { route, router }: { route: string; router: KoaRouter } =
          await import(`${__dirname}/controller/${version}/${module}`);
        version_router.use(route, router.routes());
        if (api_config.print_errors)
          console.log(`[success] ${version}/${module}`);
      }
      base_router.use(`/api/${version}`, version_router.routes());
    } catch (e) {
      if (api_config.print_errors) console.log(e);
      if (api_config.print_errors) console.log(`[fail] ${version}/${module}`);
    }
  }
};
