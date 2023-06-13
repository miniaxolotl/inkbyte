import { BaseUser } from "@lib/shared";

import { BaseRootState } from "../core/base-root.store";

export class AccountStore {
  public data: BaseUser | null = null;

  constructor(
    private readonly rootStore: BaseRootState,
    private readonly name = "account",
  ) {}
}
