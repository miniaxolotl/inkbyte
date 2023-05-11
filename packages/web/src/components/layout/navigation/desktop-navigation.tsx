import React from "react";

import { Box, BoxProps, List, Title } from "@mantine/core";

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
    <Box sx={{ ...sx, display: "flex", justifyContent: "space-between" }}>
      <DesktopNavigationList>
        <DesktopNavigationItem>
          <Title size="h4" order={1}>
            <Link href="/">
              <Link color="brand-red">{title}</Link>
            </Link>
          </Title>
        </DesktopNavigationItem>
      </DesktopNavigationList>
      <DesktopNavigationList>{children}</DesktopNavigationList>
    </Box>
  );
};

const DesktopNavigationList = ({
  children,
}: {
  children?: React.ReactNode;
}) => (
  <List
    sx={{
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
