import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

const envConfig = dotenv.config({
  path: "../../.env",
  override: true,
});

dotenvExpand.expand(envConfig);

import Koa from "koa";
import websockify from "koa-websocket";

import { api_config } from "@lib/config";

import { base_router, load_routes } from "./route.config";
import { body_parser, cors, json_parser, logger } from "./middleware.config";
import { SERVER_ERROR } from "@lib/utility";
import { error_logger } from "./error_logger.config";
import { sanitize } from "./sanitize.config";

/************************************************
 * setup
 ************************************************/

const base_server: Koa = new Koa();
const server = websockify(base_server);

server.use(cors);

server.use(body_parser);
server.use(json_parser);
server.use(logger);

server.use(error_logger);
server.use(sanitize);

server.use(async (ctx, next) => {
  await next();
  ctx.set("Access-Control-Allow-Origin", "*");
});

load_routes().then(() => {
  server.use(base_router.routes());
  server.use(async (ctx, next) => {
    await next();
    if (!ctx.router.matched) {
      ctx.throw(
        SERVER_ERROR.NOT_IMPLEMENTED.status,
        SERVER_ERROR.NOT_IMPLEMENTED.message,
      );
    }
  });

  server.listen(api_config.api_port, () => {
    const is_prod = api_config.env === "production";
    const dev_url = `http://localhost:${api_config.api_port}/api/v1`;
    const prod_url = `https://${api_config.api_host}/api/v1`;
    console.log(`[env]: ${server.env}`);
    console.log(`[gate]: ${api_config.api_host}`);
    console.log(`[port]: ${api_config.api_port}`);
    console.log(`[listening]: ${is_prod ? prod_url : dev_url}`);
  });
});
