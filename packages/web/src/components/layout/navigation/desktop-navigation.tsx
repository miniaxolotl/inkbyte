import React from "react";

import { Box, BoxProps, List, ListProps, Title } from "@mantine/core";

import { Link } from "@components/core";

export type DesktopNavigationProps = BoxProps & {
  children?: React.ReactNode;
  title: string;
};

export const DesktopNavigation = ({
  children,
  sx,
  title,
}: DesktopNavigationProps) => {
  return (
    <Box
      sx={{
        ...sx,
        display: "flex",
        justifyContent: "space-between",
        "@media (max-width: 680px)": {
          display: "none",
          visibility: "hidden",
        },
      }}
    >
      <DesktopNavigationList sx={{ flex: 1 }}>
        <DesktopNavigationItem>
          <Title size="h2" order={1}>
            <Link href="/">{title}</Link>
          </Title>
        </DesktopNavigationItem>
      </DesktopNavigationList>
      <DesktopNavigationList
        sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}
      >
        {children}
      </DesktopNavigationList>
    </Box>
  );
};

export const DesktopNavigationList = ({ sx, children }: ListProps) => (
  <List
    sx={{
      ...sx,
      display: "flex",
      flexDirection: "row",
      gap: 12,
      li: {
        listStyle: "none",
        display: "flex",
        alignItems: "center",
      },
      "span, a": {
        display: "flex",
        alignItems: "center",
        gap: 4,
      },
    }}
  >
    {children}
  </List>
);

export const DesktopNavigationItem = ({
  children,
}: {
  children?: React.ReactNode;
}) => <List.Item>{children}</List.Item>;
