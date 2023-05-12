import React from "react";

import { Box, BoxProps, List, ListProps, Title } from "@mantine/core";

import { Link } from "@components/core";

export type MobileNavigationProps = BoxProps & {
  children?: React.ReactNode;
  title: string;
};

export const MobileNavigation = ({
  children,
  sx,
  title,
}: MobileNavigationProps) => {
  return (
    <Box
      sx={{
        ...sx,
        justifyContent: "space-between",
        display: "none",
        visibility: "hidden",
        "@media (max-width: 680px)": {
          display: "flex",
          visibility: "visible",
        },
      }}
    >
      <MobileNavigationList sx={{ flex: 1 }}>
        <MobileNavigationItem>
          <Title size="h2" order={1}>
            <Link href="/">{title}</Link>
          </Title>
        </MobileNavigationItem>
      </MobileNavigationList>
      <MobileNavigationList
        sx={{ display: "flex", justifyContent: "flex-end", flex: 1 }}
      >
        {children}
      </MobileNavigationList>
    </Box>
  );
};

const MobileNavigationList = ({ sx, children }: ListProps) => (
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

export const MobileNavigationItem = ({
  children,
}: {
  children?: React.ReactNode;
}) => <List.Item>{children}</List.Item>;
