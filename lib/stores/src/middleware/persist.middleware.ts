import { proxy, subscribe } from "valtio";
import { addDays } from "date-fns";
import cookie from "cookie";

import { PageCookies } from "@lib/shared";
import { web_config } from "@lib/config";

const isServer = typeof window === "undefined";

export class PersistProxy {
  public name = "";
  public isPersisting = false;
  public isHydrating = false;
  public isHydrated = false;
}

export const persistState = <T extends PersistProxy>(
  initialState: T,
  keys: (keyof T & string)[] = [],
  serverCookies?: PageCookies,
) => {
  initialState.isHydrating = true;

  const persistedState = loadCookies(serverCookies);
  if (persistedState) {
    keys.forEach((key) => {
      const persistedProperty = loadCookie(persistedState, key);
      if (persistedProperty) initialState[key] = persistedProperty;
    });
  }

  const state = proxy(initialState);

  initialState.isHydrating = false;
  initialState.isHydrated = true;

  if (isServer) return;

  const persist = <T extends PersistProxy>(
    // initialState: T,
    state: T,
    keys: (keyof T & string)[],
  ) => {
    if (!state.isHydrated) return;
    if (state.isHydrating) return;
    if (state.isPersisting) return;
    state.isPersisting = true;
    const pickedProperties = keys.reduce(
      (acc, key) => ({ ...acc, [key]: state[key] }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<string, any>,
    );

    for (const key in pickedProperties) {
      if (pickedProperties[key]) {
        document.cookie = cookie.serialize(
          key,
          typeof pickedProperties[key] === "object"
            ? JSON.stringify(pickedProperties[key])
            : pickedProperties[key],
          {
            secure: true,
            domain: web_config.web_host,
            path: "/",
            sameSite: true,
            expires: addDays(new Date(), 30),
          },
        );
      }
    }

    state.isPersisting = false;
  };

  persist(state, keys);
  subscribe(state, () => persist(state, keys), true);
};

const loadCookies = (serverCookies: PageCookies = {}) => {
  try {
    const clientCookies = !isServer
      ? cookie.parse(document.cookie ?? "")
      : null;
    return clientCookies ?? serverCookies;
  } catch {
    return null;
  }
};

const loadCookie = (cookies: PageCookies = {}, key: string) => {
  try {
    if (typeof cookies[key] === "string") return JSON.parse(cookies[key]);
  } catch {
    return null;
  }
  return null;
};
