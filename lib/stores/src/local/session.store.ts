import { SessionModel } from "@lib/shared";
import type { UserLoginSchema } from "@lib/schema-validator";

import { PersistProxy, persistState } from "../middleware";
import { BaseRootState } from "../core";
import { navigate } from "vite-plugin-ssr/client/router";
import { ref } from "valtio";

export class SessionStore implements PersistProxy {
  public readonly rootStore: BaseRootState;
  public session_token: string | null = null;

  isPersisting = false;
  isHydrating = false;
  isHydrated = false;

  constructor(rootStore: BaseRootState, public readonly name = "session") {
    this.rootStore = ref(rootStore);
    persistState(this, ["session_token"], rootStore.cookies);
  }

  async login(payload: UserLoginSchema) {
    const response = await this.createSession(payload);
    if (!response.ok) {
      this.reset();
      return response;
    }

    this.session_token = response.data.token;
    this.rootStore.account.account_data = response.data.user;
    this.rootStore.api.api_token = response.data.token;

    navigate("/");

    return response;
  }

  async refresh() {
    this.refreshSession().then((response) => {
      if (response.ok) {
        this.session_token = response.data.token;
      } else {
        this.reset();
      }
    });
  }

  async createSession(payload: UserLoginSchema) {
    const response = await this.rootStore.api.post<
      SessionModel,
      UserLoginSchema,
      string
    >("auth", { body: payload });
    return response;
  }

  async refreshSession() {
    const response = await this.rootStore.api.post<
      SessionModel,
      UserLoginSchema,
      string
    >("auth/refresh", { headers: {} });
    return response;
  }

  public isLoggedIn() {
    return !!this.session_token;
  }

  public async reset() {
    this.rootStore.session.session_token = null;
    this.rootStore.account.reset();
    this.rootStore.api.clearToken();
  }
}
