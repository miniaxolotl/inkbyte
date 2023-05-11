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
            "brand-peach": [
              "#ffe8e2",
              "#ffc1b3",
              "#fd9882",
              "#fd704f",
              "#fc491f",
              "#e33006",
              "#b12503",
              "#7f1a02",
              "#4d0e00",
              "#1e0300",
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
