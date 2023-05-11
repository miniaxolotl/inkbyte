// `usePageContext` allows us to access `pageContext` in any React component.
// More infos: https://vite-plugin-ssr.com/pageContext-anywhere
import React, { ReactNode, createContext, useContext } from "react";

import { PageContext } from "@lib/vite-react";

const Context = createContext<PageContext | unknown>(undefined);

type PageContextProviderProps = {
  pageContext: PageContext;
  children: ReactNode;
};

export const PageContextProvider = ({
  pageContext,
  children,
}: PageContextProviderProps) => {
  return <Context.Provider value={pageContext}>{children}</Context.Provider>;
};

export const usePageContext = () => {
  const pageContext = useContext(Context) as PageContext;
  if (!pageContext)
    new Error("'usePageContext' must be called inside 'PageContextProvider'");
  pageContext.exports.documentProps = pageContext.exports.documentProps || {};
  return pageContext;
};
