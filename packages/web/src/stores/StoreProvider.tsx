import React, { ReactNode, createContext, useContext, useRef } from "react";
import { proxy, useSnapshot } from "valtio";

import { PageCookies } from "@lib/vite-react";

import { RootStore } from "./root.store";

let clientStore: RootStore | null = null;

const Context = createContext<RootStore | null>(null);

type StoreContextProviderProps = {
  children: ReactNode;
  cookies?: PageCookies;
  referer?: string;
};

export const StoreProvider: React.FC<StoreContextProviderProps> = ({
  children,
  cookies,
  referer,
}) => {
  const store = useRef(clientStore ?? proxy(new RootStore(cookies, referer)));

  if (!clientStore) clientStore = store.current;

  return <Context.Provider value={store.current}>{children}</Context.Provider>;
};

export const useStore = () => {
  const store = useContext(Context) ?? null;
  if (!store) throw new Error("useStore must be used within a StoreProvider.");
  return store;
};

export const useStateProvider = () => {
  const store = useContext(Context) ?? null;
  if (!store) throw new Error("useStore must be used within a StoreProvider.");
  return useSnapshot(store);
};
