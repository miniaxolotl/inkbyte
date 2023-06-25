import { PageCookies } from "@lib/shared";

import {
  type AccountStore,
  type ApiStore,
  type LinkStore,
  type SessionStore,
  type ToastStore,
} from "../local";

export interface BaseRootState {
  readonly isServer: boolean;
  readonly api: ApiStore;
  readonly account: AccountStore;
  readonly session: SessionStore;
  readonly link: LinkStore;
  readonly toast: ToastStore;
  readonly cookies?: PageCookies;
}
