import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

dotenvExpand.expand(
  dotenv.config({
    path: "../../.env",
  }),
);

import Koa from "koa";
import websockify from "koa-websocket";

import { api_config } from "@lib/config";

import { base_router, load_routes } from "./route.config";
import { body_parser, cors, json_parser, logger } from "./middleware.config";
import { error_logger } from "./error_logger.config";

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

load_routes().then(() => {
  server.use(base_router.routes());
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
