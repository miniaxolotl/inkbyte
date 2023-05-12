import React from "react";

import {
  Box,
  BoxProps,
  List,
  ListProps,
  Title,
  TitleOrder,
} from "@mantine/core";

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
        <DesktopNavigationItem size="h2" order={2}>
          <Link href="/">{title}</Link>
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
  size,
  order,
}: {
  children?: React.ReactNode;
  size?: string;
  order?: TitleOrder;
}) => (
  <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
    <Title
      order={order ?? 3}
      size={size ?? "h4"}
      sx={{ display: "flex", alignItems: "center", gap: 2 }}
    >
      {children}
    </Title>
  </List.Item>
);
