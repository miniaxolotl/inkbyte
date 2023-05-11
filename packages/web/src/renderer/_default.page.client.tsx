import React from "react";

import ReactDOM, { createRoot, hydrateRoot } from "react-dom/client";

import { PageContextClient } from "@lib/vite-react";
import { web_config } from "@lib/config";

import { PageShell } from "./pages";

export const clientRouting = true;

export const prefetchStaticAssets = { when: "VIEWPORT" };

export const hydrationCanBeAborted = true;

// export const onPageTransitionStart = (pageContext: PageContextClient) => {
//   console.log("Page Transition: start");
// };

// export const onPageTransitionEnd = (pageContext: PageContextClient) => {
//   console.log("Page Transition: end");
// };

let root: ReactDOM.Root;

export const render = async (pageContext: PageContextClient) => {
  const {
    Page,
    pageProps,
    exports: { documentProps = {} },
  } = pageContext;

  const title = documentProps.title || web_config.app_title;

  const pageContent = (
    <PageShell pageContext={pageContext}>
      <Page {...pageProps} />
    </PageShell>
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const container = document.getElementById("page-root")!;

  if (pageContext.isHydration) {
    root = hydrateRoot(container, pageContent);
  } else {
    if (!root) root = createRoot(container);
    root.render(pageContent);
  }

  document.title = title;
};
