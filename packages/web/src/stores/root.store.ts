import {
  AccountStore,
  ApiStore,
  BaseRootState,
  SessionStore,
} from "@lib/stores";

export class RootStore implements BaseRootState {
  public readonly isServer: boolean = typeof window === "undefined";

  public readonly api: ApiStore = new ApiStore(this);
  public readonly account: AccountStore = new AccountStore(this);
  public readonly session: SessionStore = new SessionStore(this);

  constructor(private readonly name = "root-store") {}
}
