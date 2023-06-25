import { UserModel } from "@lib/shared";

import { PersistProxy, persistState } from "../middleware";
import { BaseRootState } from "../core";
import { ref } from "valtio";

export class AccountStore implements PersistProxy {
  public readonly rootStore: BaseRootState;
  public data: UserModel | null = null;

  isPersisting = false;
  isHydrating = false;
  isHydrated = false;

  constructor(rootStore: BaseRootState, public readonly name = "account") {
    this.rootStore = ref(rootStore);
    persistState(this, ["data"], rootStore.cookies);
  }

  public reset() {
    this.data = null;
  }
}
