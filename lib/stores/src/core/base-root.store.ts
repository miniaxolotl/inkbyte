import type { AccountStore, ApiStore, SessionStore } from "../local";

export interface BaseRootState {
  readonly isServer: boolean;
  readonly api: ApiStore;
  readonly account: AccountStore;
  readonly session: SessionStore;
}
