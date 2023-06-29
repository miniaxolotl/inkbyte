import { proxy, subscribe } from "valtio";

const isServer = typeof window === "undefined";

class PersistProxy {
  public name = "";
  public isPersisting = false;
  public isHydrating = false;
  public isHydrated = false;
}

export const persistLocalState = <T extends PersistProxy>(
  initialState: T,
  keys: (keyof T & string)[] = [],
) => {
  initialState.isHydrating = true;

  const persistedState = loadLocalStorage(initialState.name);
  if (persistedState) {
    keys.forEach((key) => {
      if (persistedState[key]) initialState[key] = persistedState[key];
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
      {},
    );

    localStorage.setItem(state.name, JSON.stringify(pickedProperties));
    state.isPersisting = false;
  };

  persist(state, keys);
  subscribe(state, () => persist(state, keys), true);
};

const loadLocalStorage = (key: string) => {
  try {
    const persistedStorage = !isServer ? localStorage.getItem(key) : null;
    return persistedStorage ? JSON.parse(persistedStorage) : null;
  } catch {
    return null;
  }
};
