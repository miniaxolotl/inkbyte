import { MeiliSearch } from 'meilisearch';

import { api_config } from '@lib/config';

export const meili_db: MeiliSearch = new MeiliSearch({
  host: api_config.meilisearch_host,
  apiKey: api_config.meilisearch_private_key,
});

export const connect_meili = async () => {
  try {
    if (!meili_db) throw new Error('meili_db is undefined');
    await meili_db.health();
    console.log(`[database]: connected to meilisearch`);
  } catch {
    console.log(`[database]: {error} meilisearch`);
  }
};
