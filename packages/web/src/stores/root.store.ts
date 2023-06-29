import { proxy } from "valtio";

import {
  AccountStore,
  ApiStore,
  BaseRootState,
  LinkStore,
  SessionStore,
  ToastStore,
} from "@lib/stores";
import { PageCookies } from "@lib/vite-react";

export type RootState = {
  isServer: boolean;
  api: ApiStore;
  account: AccountStore;
  session: SessionStore;
};

export class RootStore implements BaseRootState {
  public readonly isServer: boolean = typeof window === "undefined";

  public api!: ApiStore;
  public account!: AccountStore;
  public link!: LinkStore;
  public session!: SessionStore;
  public toast!: ToastStore;

  constructor(
    public readonly cookies?: PageCookies,
    public readonly referer?: string,
    public readonly name = "root-store",
  ) {
    this.api = proxy(new ApiStore());
    this.account = proxy(new AccountStore(this));
    this.link = proxy(new LinkStore(this));
    this.session = proxy(new SessionStore(this));
    this.toast = proxy(new ToastStore(this));
  }
}
