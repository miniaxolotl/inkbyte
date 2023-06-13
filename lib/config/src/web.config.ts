import { IBaseConfig, IConfigEnvironment, base_config } from "./base.config";

const env = typeof window === "undefined" ? process.env : import.meta.env;

const dev = env.VITE_ENV === "development";

export type IWebConfig = IBaseConfig;

export const web_config: IWebConfig = {
  ...base_config,
  /** general */
  env: (env.VITE_ENV as IConfigEnvironment) ?? base_config.env,
  print_errors: env.VITE_DEPLOYMENT === "false" ? false : true,
  appname: env.VITE_APPNAME ?? base_config.appname,
  app_title: env.VITE_APP_TITLE ?? base_config.app_title,
  app_email: env.VITE_APP_EMAIL ?? base_config.app_email,
  app_description: env.VITE_APP_DESCRIPTION ?? base_config.app_description,
  host: env.VITE_HOST ?? base_config.host,
  /** api config */
  api_port: parseInt(env.VITE_API_PORT ?? `${base_config.api_port}`),
  api_host: dev ? "localhost" : env.VITE_API_HOST ?? base_config.api_host,
  api_version: env.VITE_API_VERSION ?? base_config.api_version,
  /** web config */
  web_port: parseInt(env.VITE_WEB_PORT ?? `${base_config.web_port}`),
  web_host: dev ? "localhost" : env.VITE_WEB_HOST ?? base_config.web_host,
  /** cms config */
  dashboard_port: parseInt(
    env.VITE_DASHBOARD_PORT ?? `${base_config.dashboard_port}`,
  ),
  dashboard_host: dev
    ? "localhost"
    : env.VITE_DASHBOARD_HOST ?? base_config.dashboard_host,
  /** data */
  max_bytes: parseInt(env.VITE_MAX_BYTES || `${base_config.max_bytes}`),
  /** database (MeiliSearch) */
  meilisearch_host: env.VITE_MEILISEARCH_HOST ?? base_config.meilisearch_host,
  meilisearch_port: parseInt(
    env.VITE_MEILISEARCH_PORT ?? `${base_config.meilisearch_port}`,
  ),
  meilisearch_public_key:
    env.VITE_MEILISEARCH_PUBLIC_KEY ?? base_config.meilisearch_public_key,
  /** s3 */
  s3: {
    endpoint: env.VITE_S3_ENDPOINT ?? base_config.s3.endpoint,
    bucket: env.VITE_S3_BUCKET ?? base_config.s3.bucket,
    region: env.VITE_S3_REGION ?? base_config.s3.region,
  },
};
