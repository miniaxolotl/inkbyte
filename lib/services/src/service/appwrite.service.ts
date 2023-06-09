import { Client } from "node-appwrite";

import { api_config } from "@lib/config";

export const appwrite_client = new Client();

appwrite_client
  .setEndpoint(api_config.appwrite.endpoint)
  .setProject(api_config.appwrite.project)
  .setKey(api_config.appwrite.key);
