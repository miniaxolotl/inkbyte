import { ref } from "valtio";

import { UserCreateSchema } from "@lib/schema-validator";
import { UserModel } from "@lib/shared";

import { PersistProxy, persistState } from "../middleware";
import { BaseRootState } from "../core";

export class AccountStore implements PersistProxy {
  public readonly rootStore: BaseRootState;
  public account_data: UserModel | null = null;

  isPersisting = false;
  isHydrating = false;
  isHydrated = false;

  constructor(rootStore: BaseRootState, public readonly name = "account") {
    this.rootStore = ref(rootStore);
    persistState(this, ["account_data"], rootStore.cookies);
  }

  async register(payload: UserCreateSchema) {
    const response = await this.createAccount(payload);
    if (!response.ok) {
      this.reset();
      this.rootStore.session.reset();
      return response;
    }

    return await this.rootStore.session.login({
      email: payload.email,
      password: payload.password,
      remember_me: false,
    });
  }

  private async createAccount(payload: UserCreateSchema) {
    const response = await this.rootStore.api.post<
      UserModel,
      UserCreateSchema,
      string
    >("user", { body: payload });
    return response;
  }

  public reset() {
    this.account_data = null;
  }
}
