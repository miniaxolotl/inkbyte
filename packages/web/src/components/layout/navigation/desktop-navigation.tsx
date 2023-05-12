import React from "react";

import {
  Box,
  BoxProps,
  List,
  ListProps,
  Menu,
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
      sx={{ display: "flex", alignItems: "center", gap: 4 }}
    >
      {children}
    </Title>
  </List.Item>
);

export const DesktopNavigationItemDropdown = ({
  children,
  size,
  order,
  items,
}: {
  children?: React.ReactNode;
  size?: string;
  order?: TitleOrder;
  items?: { label: string; href: string }[];
}) => (
  <List.Item sx={{ fontFamily: "'Secular One', sans-serif" }}>
    <Menu trigger="hover" shadow="md" position="bottom-start" keepMounted>
      <Menu.Target>
        <Title
          order={order ?? 3}
          size={size ?? "h4"}
          sx={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          {children}
        </Title>
      </Menu.Target>

      <Menu.Dropdown
        sx={{
          border: "1px solid #ccc",
          borderRadius: 4,
        }}
      >
        {items &&
          items.map(({ label, href }) => (
            <Menu.Item
              sx={{ padding: "4px 8px", borderRadius: 4 }}
              color="brand-blue"
            >
              <Link href={href}>{label}</Link>
            </Menu.Item>
          ))}
      </Menu.Dropdown>
    </Menu>
  </List.Item>
);
