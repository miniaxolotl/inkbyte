import React, { ReactNode, createContext, useContext, useRef } from "react";

import { proxy, useSnapshot } from "valtio";

import { RootStore } from "./root.store";

let clientStore: RootStore | null = null;

const Context = createContext<React.MutableRefObject<RootStore> | null>(null);

type StoreContextProviderProps = {
  children: ReactNode;
};

export const StoreProvider: React.FC<StoreContextProviderProps> = ({
  children,
}) => {
  const store = useRef<RootStore>(clientStore || proxy(new RootStore()));
  if (!clientStore) clientStore = store.current;
  return <Context.Provider value={store}>{children}</Context.Provider>;
};

export const useStore = () => {
  const store = useContext(Context)?.current ?? null;
  if (!store) throw new Error("useStore must be used within a StoreProvider.");
  return useSnapshot(store);
};
