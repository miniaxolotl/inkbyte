import { BaseSession } from "@lib/shared";
import type { UserLoginSchema } from "@lib/schema-validator";

import { BaseRootState } from "../core/base-root.store";

export class SessionStore {
  public data: BaseSession | null = null;

  constructor(
    private readonly rootStore: BaseRootState,
    private readonly name = "session",
  ) {
    this.rootStore = rootStore;
  }

  createSession = async (payload: UserLoginSchema) => {
    return await this.rootStore.api.post("auth", { body: payload });
  };

  refresh = async () => {
    return await this.rootStore.api.post("auth/refresh");
  };
}
