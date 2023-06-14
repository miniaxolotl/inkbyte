import { Quikk } from "@lib/quikk";
import { web_config } from "@lib/config";

import { BaseRootState } from "../core/base-root.store";

export class ApiStore extends Quikk {
  constructor(
    private readonly rootStore: BaseRootState,
    private readonly name = "api",
  ) {
    super({
      protocol: web_config.env === "development" ? "http" : "https",
      base_port:
        web_config.env === "development" ? web_config.api_port : undefined,
      base_url: web_config.api_host,
      base_path: "api",
      api_version: "v1",
      api_token_type: "Bearer",
    });
  }
}
