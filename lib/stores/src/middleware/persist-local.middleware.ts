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
      console.log(initialState);
      console.log(pickedProperties);

      localStorage.setItem(state.name, JSON.stringify(pickedProperties));
      initialState.isPersisting = false;
    },
    true,
  );
};

const loadLocalStorage = (key: string) => {
  try {
    const persistedStorage = !isServer ? localStorage.getItem(key) : null;
    return persistedStorage ? JSON.parse(persistedStorage) : null;
  } catch {
    return null;
  }
};
