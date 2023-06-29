declare module "@lib/vite-react" {
  import type { FunctionComponent, ReactNode } from "react";
  import type { PageContextBuiltIn } from "vite-plugin-ssr";
  import type { PageContextBuiltInClient } from "vite-plugin-ssr/client";

  type PageProps = Record<string, unknown>;
  type Page = ReactNode;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export type PageCookies = Record<string, any>;

  export type PageContext = {
    Page: FunctionComponent &
      Page & {
        getLayout: (page: ReactNode) => Page;
      };
    pageProps?: PageProps;
    urlPathname: string;
    origin: string;
    cookies: PageCookies;
    referer: string;
    redirectTo: string;
    exports: {
      documentProps: {
        title?: string;
        description?: string;
      };
    };
  };

  type PageContextServer = PageContext & PageContextBuiltIn<Page>;
  type PageContextClient = PageContext & PageContextBuiltInClient<Page>;

  type PageContext = PageContextClient | PageContextServer;
}
