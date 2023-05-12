import React, { StrictMode } from "react";

import { Box, MantineProvider } from "@mantine/core";

import { PageContext } from "@lib/vite-react";

import { PageContextProvider } from "@renderer/hooks";
import { StoreProvider } from "@stores";

import "./PageShell.scss";

export type PageShellProps = {
  children: React.ReactNode;
  pageContext: PageContext;
};

export const PageShell: React.FC<PageShellProps> = ({
  pageContext,
}: PageShellProps) => {
  const { Page, pageProps } = pageContext;
  const getLayout = Page.getLayout || ((page: unknown) => page);

  return (
    <StrictMode>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          focusRing: "never",
          primaryColor: "gray",
          white: "#f2f2f2",
          black: "#262626",
          colors: {
            "brand-blue": [
              "#e5f3ff",
              "#c2d7f1",
              "#9cbce2",
              "#76a1d6",
              "#5187c8",
              "#386db0",
              "#2a5589",
              "#1d3d63",
              "#0e243d",
              "#010c1a",
            ],
            "brand-cerulean": [
              "#e0f7ff",
              "#bee2f1",
              "#9acee4",
              "#74bad8",
              "#4fa6cb",
              "#378db2",
              "#276d8b",
              "#194e64",
              "#07303f",
              "#00121a",
            ],
            "brand-peach": [
              "#ffece3",
              "#f3cfbf",
              "#e5b09a",
              "#d99273",
              "#cc724c",
              "#b35933",
              "#8c4526",
              "#64301a",
              "#3f1d0d",
              "#1c0600",
            ],
            "brand-red": [
              "#ffebe8",
              "#eecbc5",
              "#ddaba2",
              "#ce8b7e",
              "#be6a5a",
              "#a55041",
              "#813d31",
              "#5e2c23",
              "#3a1914",
              "#1b0500",
            ],
            "brand-green": [
              "#eff7e7",
              "#d5e3cd",
              "#bbceb0",
              "#a2ba91",
              "#88a773",
              "#6e8d59",
              "#556e45",
              "#3c4e30",
              "#232f1b",
              "#071201",
            ],
          },
          headings: { fontFamily: "'Secular One', sans-serif" },
          fontFamily: "'Open Sans', sans-serif",
        }}
      >
        <StoreProvider>
          <PageContextProvider pageContext={pageContext}>
            <Box id="page-content" sx={{ display: "block !important" }}>
              {getLayout(<Page {...pageProps} />)}
            </Box>
          </PageContextProvider>
        </StoreProvider>
      </MantineProvider>
    </StrictMode>
  );
};
