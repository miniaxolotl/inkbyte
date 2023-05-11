import { IBaseConfig, base_config } from "./base.config";

// const env = typeof window === "undefined" ? process.env : import.meta.env;

export type IAPIConfig = IBaseConfig;

export const api_config: IAPIConfig = {
  ...base_config,
};
