import { PageCookies } from "@lib/shared";

import {
  type AccountStore,
  type ApiStore,
  type SessionStore,
  type ToastStore,
} from "../local";

export interface BaseRootState {
  readonly isServer: boolean;
  readonly api: ApiStore;
  readonly account: AccountStore;
  readonly session: SessionStore;
  readonly toast: ToastStore;
  readonly cookies?: PageCookies;
}
