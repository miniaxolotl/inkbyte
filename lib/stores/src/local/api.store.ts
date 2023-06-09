import { Quikk } from "@lib/quikk";
import { web_config } from "@lib/config";

export const apiStore = () => {
  const quikk = new Quikk({
    base_url: web_config.api_host,
    api_token_type: "Bearer",
  });

  return {
    ...quikk,
  };
};
