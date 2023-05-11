import { Stande } from "@lib/stande";
import { web_config } from "@lib/config";

export const apiStore = () => {
  const stande = new Stande({
    base_url: web_config.api_host,
    api_token_type: "Bearer",
  });

  return {
    ...stande,
  };
};
