import { Quikk } from "@lib/quikk";
import { web_config } from "@lib/config";

export class ApiStore extends Quikk {
  constructor(public readonly name = "api") {
    super({
      protocol: web_config.env === "development" ? "http" : "https",
      base_port:
        web_config.env === "development" ? web_config.api_port : undefined,
      base_url: web_config.api_host,
      base_path: "api",
      api_version: "v1",
    });
  }
}
