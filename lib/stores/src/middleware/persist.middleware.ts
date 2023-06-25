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

  const persistedState = loadCookies(serverCookies, initialState.name);
  if (persistedState) {
    keys.forEach((key) => {
      if (persistedState[key]) initialState[key] = persistedState[key];
    });
  }

  const state = proxy(initialState);

  if (isServer) return;
  subscribe(
    state,
    () => {
      if (!initialState.isHydrated) return;
      if (initialState.isHydrating) return;
      if (initialState.isPersisting) return;
      initialState.isPersisting = true;
      const pickedProperties = keys.reduce(
        (acc, key) => ({ ...acc, [key]: state[key] }),
        {},
      );
      document.cookie = cookie.serialize(
        state.name,
        JSON.stringify(pickedProperties),
        {
          secure: true,
          domain: web_config.web_host,
          expires: addDays(new Date(), 30),
        },
      );
      initialState.isPersisting = false;
    },
    true,
  );
  initialState.isHydrating = false;
  initialState.isHydrated = true;
};

const loadCookies = (serverCookies: PageCookies = {}, key: string) => {
  try {
    const clientCookies = !isServer
      ? cookie.parse(document.cookie ?? "")
      : null;
    const cookies = clientCookies ?? serverCookies;
    if (cookies) return cookies[key] ? JSON.parse(cookies[key]) : null;
  } catch {
    return null;
  }
  return null;
};
