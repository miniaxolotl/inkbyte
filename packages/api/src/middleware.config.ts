import KoaBody from "koa-body";
import KoaCORS from "@koa/cors";
import KoaJSON from "koa-json";
import KoaLogger from "koa-logger";
import fs from "fs";

import { api_config } from "@lib/config";

if (!fs.existsSync(api_config.data_dir))
  fs.mkdirSync(api_config.data_dir, { recursive: true });
console.log(`[data_dir]: ${api_config.data_dir}`);

export const cors = KoaCORS({
  origin: "*",
  credentials: true,
});

export const body_parser = KoaBody({
  formidable: {
    maxFileSize: api_config.max_bytes,
    uploadDir: api_config.data_dir,
    multiples: false,
  },
  multipart: true,
  urlencoded: true,
});

export const json_parser = KoaJSON({ pretty: false, param: "pretty" });

export const logger = KoaLogger();
