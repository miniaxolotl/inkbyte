import { IBaseConfig, base_config } from "./base.config";

const env = typeof window === "undefined" ? process.env : import.meta.env;

export type IAPIConfig = IBaseConfig & {
  /** data */
  data_dir: string;
  /** crypt */
  salt_rounds: number;
  encryption_key: string;
  session_keys: string[];
  /** database */
  database_schema: string;
  mysql_string: string;
  mysql_root_string: string;
  /** s3 */
  s3: {
    access_key: string;
    secret_key: string;
  };
};

export const api_config: IAPIConfig = {
  ...base_config,
  /** data */
  data_dir: env.DATA_DIR ?? "data",
  /** crypt */
  salt_rounds: parseInt(env.SALT_ROUNDS ?? "10"),
  encryption_key: env.ENCRYPTION_KEY ?? "",
  session_keys: env.SESSION_KEYS?.split(",") ?? [
    "secret-key",
    "super-secret-key",
  ],
  /** database */
  database_schema: env.DATABASE_SCHEMA ?? "app-schema",
  mysql_string: env.MYSQL_STRING ?? "",
  mysql_root_string: env.MYSQL_ROOT_STRING ?? "",
  /** s3 */
  s3: {
    ...base_config.s3,
    access_key: env.S3_ACCESS_KEY ?? "",
    secret_key: env.S3_SECRET_KEY ?? "",
  },
};
